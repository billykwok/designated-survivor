import threading
import requests
import time
import os
import io
import socketio
import schedule
import json
import eventlet
from picamera import PiCamera
from pydub import AudioSegment
from pydub.playback import play
from google.cloud import vision, texttospeech
from adafruit_crickit import crickit
from adafruit_seesaw.neopixel import NeoPixel

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "../experiment-326921-9b0258775132.json"
captured_image_path = "picamera.jpg"
expected_tags_by_category = {
    "water": ["water", "aqua", "agua", "drink"],
    "food": ["energy", "snack", "protein"],
    "torch": ["torch", "flash", "light", "automotive lighting"],
    "shelter": ["blanket", "t-shirt", "survival", "shelter", "tent"],
    "ppe": ["mask", "personal protective equipment", "sports equipment", "helmet"],
    "medical": [
        "aid",
        "band",
        "font",
        "entertainment",
        "comfortable",
        "combort",
        "stretches",
        "ttretches",
        "organism",
    ],
}

vision_client = vision.ImageAnnotatorClient()
tts_client = texttospeech.TextToSpeechClient()
sio = socketio.Server(cors_allowed_origins="*")
app = socketio.WSGIApp(sio, static_files={})


def run_continuously(interval=1):
    cease_continuous_run = threading.Event()

    class ScheduleThread(threading.Thread):
        @classmethod
        def run(cls):
            while not cease_continuous_run.is_set():
                schedule.run_pending()
                time.sleep(interval)

    continuous_thread = ScheduleThread()
    continuous_thread.start()
    return cease_continuous_run


def play_text(text: str):
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US", ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )
    response = tts_client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )
    play(AudioSegment.from_file(io.BytesIO(response.audio_content), format="mp3"))


def detect_text(image) -> set:
    response = vision_client.text_detection(image=image)
    return set([text.description.lower() for text in response.text_annotations])


def label_image(image) -> set:
    response = vision_client.label_detection(image=image)
    return set([label.description.lower() for label in response.label_annotations])


def locate_objects(image) -> set:
    response = vision_client.object_localization(image=image)
    return set([obj.name.lower() for obj in response.localized_object_annotations])


def detect_web(image) -> set:
    response = vision_client.web_detection(image=image)
    return set(
        [label.label.lower() for label in response.web_detection.best_guess_labels]
    )


def check_inventory(camera: PiCamera, neopixel: NeoPixel):
    for color in ((255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 255)):
        try:
            neopixel.fill(color)
            neopixel.show()

            camera.capture(captured_image_path)

            neopixel.fill((0, 0, 0))
            neopixel.show()

            with open(captured_image_path, "rb") as image_file:
                gcp_image = vision.Image(content=image_file.read())
                detected_tags = (
                    set.union(detect_text(gcp_image))
                    .union(label_image(gcp_image))
                    .union(locate_objects(gcp_image))
                    .union(detect_web(gcp_image))
                )
                print(detected_tags)
                inventory = {
                    category: len(detected_tags.intersection(expected_tags))
                    for category, expected_tags in expected_tags_by_category.items()
                }
                sio.emit("inventory", json.dumps(inventory))
                print(inventory)
        except IOError as e:
            print("I/O error: {0}".format(e))
        except ValueError as e:
            print("Value error: {0}".format(e))


def check_earthquake():
    try:
        response = requests.get(
            "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson"
        ).json()
        # with open('./usgs.json') as json_file:
        #     response = json.load(json_file)

        print(response["features"])
        earthquakes = [
            feature["properties"]
            for feature in response["features"]
            if feature["properties"]["type"] == "earthquake"
        ]

        if earthquakes:
            sio.emit("earthquake", json.dumps(earthquakes[0]))

    except IOError as e:
        print("I/O error: {0}".format(e))
    except ValueError as e:
        print("Value error: {0}".format(e))


def main():
    try:
        camera = PiCamera()
        neopixel = NeoPixel(crickit.seesaw, 20, 30)

        schedule.every(10).seconds.do(check_inventory, camera, neopixel)
        schedule.every(5).seconds.do(check_earthquake)
        stop_run_continuously = run_continuously()

        eventlet.wsgi.server(eventlet.listen(("", 13241)), app)

    except KeyboardInterrupt:
        print("Exiting gracefully...")

    stop_run_continuously.set()


if __name__ == "__main__":
    main()
