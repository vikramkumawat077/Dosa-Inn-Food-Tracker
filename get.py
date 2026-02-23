from youtube_transcript_api import YouTubeTranscriptApi
try:
    data = YouTubeTranscriptApi.get_transcript('kH0nafGhbww')
    text = " ".join([d['text'] for d in data])
    print(text)
except Exception as e:
    import traceback
    traceback.print_exc()
