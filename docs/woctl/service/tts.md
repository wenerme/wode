# Text to speech

`tts` generates an audio file from text. With no configured TTS service, the Node CLI uses Microsoft's Edge online read-aloud endpoint with `zh-CN-XiaoxiaoNeural` and MP3. It requires no user API key at the time of implementation. This is an internal Edge protocol, with no public API stability or service-level guarantee.

```sh
woctl tts 'Hello' --output-file hello.mp3
woctl tts speak --input @speech.txt --output-file speech.mp3
printf 'Hello from stdin' | woctl tts --input - --output-file speech.mp3
woctl tts voices --locale zh-CN
woctl tts voices --query Xiaoxiao --json
woctl tts --list-services --json
```

The built-in default is temporary: it does not create or edit a configuration file. Configured TTS services use the normal explicit service, capability default, provider default and unique-candidate selection rules. Disabled services, an unavailable explicit selection, an invalid default or ambiguous services do not trigger a fallback. A failed Edge request does not silently switch to another provider.

## Edge voices and prosody

```sh
woctl tts 'Hello' --voice en-US-JennyNeural --output-file hello.mp3
woctl tts 'Hello' --speed 1.1 --output-file faster.mp3
woctl tts 'Hello' --rate=+10% --pitch=+5Hz --volume=-10% --output-file adjusted.mp3
```

Use `tts voices` to discover currently available IDs. `--speed` is a ratio and conflicts with `--rate`. Edge's rate and volume use signed percentages; pitch uses signed Hz. Edge currently supports MP3 only and rejects model-specific instructions and model selection.

To configure Edge explicitly:

```yaml
version: 1
services:
  - name: speech
    type: edge-tts
    options:
      voice: zh-CN-XiaoxiaoNeural
defaults:
  services:
    tts: speech
```

`edge` is an alias of the `edge-tts` provider. HTTP voice discovery and speech synthesis support cancellation, timeout and bounded responses. Text is XML-escaped and split at safe Unicode boundaries for the Edge protocol.

## Model-backed services

The `openai-tts` provider sends a standard `POST /audio/speech` request relative to the configured API base. For example, the following base resolves to `https://speech.example.test/v1/audio/speech`:

```yaml
version: 1
services:
  - name: models
    type: openai-tts
    baseUrl: https://speech.example.test/v1
    options:
      model: speech-model-id
      voice: voice-id
      apiKeyEnv: SPEECH_API_KEY
defaults:
  services:
    tts: models
```

Omit `apiKeyEnv` for a self-hosted endpoint that does not require authentication. An inline `apiKey`, including an `env://NAME` reference, is also supported. Credentials are resolved only when creating a client for an actual operation.

```sh
woctl tts 'Hello' --service models --output-file speech.mp3
woctl tts 'Hello' --service models --model another-model --voice another-voice --output-file speech.wav
woctl tts 'Hello' --service models --instructions 'Speak calmly' --output-file speech.mp3
```

The endpoint must implement the OpenAI-compatible speech request and binary response. A model name alone does not establish API compatibility. No private model endpoint was queried during implementation, and ASR is outside this feature.

MP3, WAV, Opus, AAC, FLAC and PCM are supported by the adapter when the endpoint supplies the requested format. The CLI infers a known audio format from the destination extension unless `--audio-format` is supplied; conflicting formats and extensions are rejected. A model can be configured on the service or passed with `--model`. OpenAI-compatible speech does not have a standard voice-list endpoint, so this provider reports voice discovery as unsupported; pass the appropriate voice ID explicitly.

## Audio output and limits

`--output-file` is required. Audio is written as bytes through a host port. `--json` describes the saved file, provider, voice, model, format and byte count; it does not include the audio payload.

```sh
woctl tts 'Hello' --output-file hello.mp3 --json
woctl tts 'Hello' --output-file - > hello.mp3
```

Binary stdout uses the host's byte stream, adds no newline, and cannot be combined with JSON or another formatted output mode. Text input is limited to 100,000 UTF-8 bytes; returned audio is limited to 16 MiB. Provider-specific options are checked before reading files/stdin or resolving credentials.

The service SDK returns `Uint8Array`. Generic schema/call transport uses a bounded base64 envelope, and the typed tool client restores bytes. This implementation returns complete bounded audio; it does not advertise streaming playback.

## SDK and host reuse

- `@wener/client/tts`: portable Edge and OpenAI-compatible clients, shared request/result types and pure input validators.
- `@wener/client/tts/node`: Node `ws` socket adapter; constructing its factory opens no connection. Direct SDK consumers of this Node entry provide the optional `ws` peer dependency.
- `@wener/common/service/tts`: schemas, service contract, provider preflight and typed operations.
- `@wener/common/service/tts/client`: typed schema/call client with binary restoration.

Native woctl supplies the socket and file ports. A browser or custom host injects its own compatible transport and binary output ports. Node `ws` is excluded from the browser core. The CLI bundle contains its Node transport, so CLI users do not install `ws` separately.

Protocol checksum attribution is included in the package's `THIRD_PARTY_NOTICES.md`. Tests use fake transports and local responses; public Edge synthesis has also been tested with a short non-sensitive phrase. Model-backed behavior is validated against mocks rather than a private deployment.
