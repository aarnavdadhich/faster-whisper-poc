import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export class TranscriptionService {
  private ai: GoogleGenAI;
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  async start(onTranscript: (text: string, isFinal: boolean) => void) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Using a smaller buffer size for lower latency
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.session = await this.ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are a transcription assistant for a live interview. Your only job is to provide accurate, real-time transcriptions of the audio you hear. Do not respond to the user, just transcribe.",
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts) {
              // Handle model output if needed, but we want input transcription
            }
            
            // Handle input transcription (user's speech)
            if (message.serverContent?.interrupted) {
                // Handle interruption if needed
            }

            // The transcription of the user's input is often found in specific message types
            // For Gemini Live, we look for transcription chunks
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
                // This would be the model's response, but we want the user's speech
            }
          }
        }
      });

      // We need to handle the transcription specifically. 
      // In Gemini Live, inputAudioTranscription provides the user's speech text.
      // However, the current SDK might deliver it via specific message types.
      
      // Let's refine the callback to handle transcription specifically
      this.session.callbacks.onmessage = (message: LiveServerMessage) => {
        // Check for input transcription (user's speech)
        const inputTranscription = (message as any).serverContent?.inputAudioTranscription;
        if (inputTranscription) {
          onTranscript(inputTranscription.text, inputTranscription.done);
        }
      };

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert to 16-bit PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        const base64Data = btoa(
          String.fromCharCode(...new Uint8Array(pcmData.buffer))
        );

        this.session.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

    } catch (error) {
      console.error("Transcription error:", error);
      throw error;
    }
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.session) {
      // session.close() is not always available on the promise, need to handle carefully
      this.session.then?.((s: any) => s.close?.());
    }
  }
}
