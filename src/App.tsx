/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Settings, 
  MessageSquare, 
  Users, 
  Layout, 
  MoreVertical,
  PhoneOff,
  Clock,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TranscriptionService } from './services/transcriptionService';

interface TranscriptItem {
  id: string;
  text: string;
  speaker: 'Candidate' | 'Interviewer';
  timestamp: Date;
  isFinal: boolean;
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const transcriptionServiceRef = useRef<TranscriptionService | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  useEffect(() => {
    if (isVideoOn && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => console.error("Video error:", err));
    } else if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, [isVideoOn]);

  const toggleRecording = async () => {
    if (isRecording) {
      transcriptionServiceRef.current?.stop();
      setIsRecording(false);
    } else {
      if (!transcriptionServiceRef.current) {
        transcriptionServiceRef.current = new TranscriptionService();
      }
      
      setIsRecording(true);
      
      try {
        await transcriptionServiceRef.current.start((text, isFinal) => {
          setTranscripts(prev => {
            const last = prev[prev.length - 1];
            
            // If the last item is from the same speaker and not final, update it
            if (last && last.speaker === 'Candidate' && !last.isFinal) {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...last,
                text: text,
                isFinal: isFinal
              };
              return updated;
            }
            
            // Otherwise add a new item
            return [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              text: text,
              speaker: 'Candidate',
              timestamp: new Date(),
              isFinal: isFinal
            }];
          });
        });
      } catch (err) {
        console.error("Failed to start transcription:", err);
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-brand-bg overflow-hidden">
      {/* Header */}
      <header className="h-16 border-bottom border-brand-border flex items-center justify-between px-6 glass z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-brand-accent flex items-center justify-center">
            <Terminal className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Technical Interview: Senior Frontend Engineer</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Clock size={12} /> {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="w-1 h-1 rounded-full bg-brand-border"></span>
              <span>ID: INT-882-991</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
            <Users size={20} />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
            <MessageSquare size={20} />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
            <Settings size={20} />
          </button>
          <div className="h-8 w-[1px] bg-brand-border mx-2"></div>
          <div className="flex items-center gap-2 bg-brand-accent/10 px-3 py-1.5 rounded-full border border-brand-accent/20">
            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></div>
            <span className="text-xs font-medium text-brand-accent">Live Session</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            {/* Interviewer Card */}
            <div className="relative rounded-2xl overflow-hidden glass group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
              <img 
                src="https://picsum.photos/seed/interviewer/800/600" 
                alt="Interviewer" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium">Sarah Jenkins (Interviewer)</span>
                <div className="w-6 h-6 rounded-full bg-brand-accent flex items-center justify-center">
                  <Mic size={12} className="text-white" />
                </div>
              </div>
              <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Candidate Card (Self View) */}
            <div className="relative rounded-2xl overflow-hidden glass group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
              {isVideoOn ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full bg-brand-card flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-brand-accent/20 flex items-center justify-center border border-brand-accent/30">
                    <span className="text-3xl font-bold text-brand-accent">AD</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium">Aarnav Dadhich (You)</span>
                <div className={`w-6 h-6 rounded-full ${isMicOn ? 'bg-brand-accent' : 'bg-red-500'} flex items-center justify-center`}>
                  {isMicOn ? <Mic size={12} className="text-white" /> : <MicOff size={12} className="text-white" />}
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="h-20 glass rounded-2xl flex items-center justify-center gap-4 px-8 self-center mb-4">
            <button 
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-4 rounded-full transition-all ${isMicOn ? 'bg-brand-border hover:bg-white/10 text-slate-200' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}
            >
              {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            <button 
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-4 rounded-full transition-all ${isVideoOn ? 'bg-brand-border hover:bg-white/10 text-slate-200' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}
            >
              {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
            
            <div className="w-[1px] h-8 bg-brand-border mx-2"></div>
            
            <button 
              onClick={toggleRecording}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-brand-accent hover:bg-blue-600 text-white shadow-lg shadow-brand-accent/20'}`}
            >
              {isRecording ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  Stop Transcription
                </>
              ) : (
                <>
                  <Mic size={18} />
                  Start Live Transcription
                </>
              )}
            </button>

            <div className="w-[1px] h-8 bg-brand-border mx-2"></div>

            <button className="p-4 rounded-full bg-brand-border hover:bg-white/10 text-slate-200 transition-all">
              <Layout size={24} />
            </button>
            <button className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all">
              <PhoneOff size={24} />
            </button>
          </div>
        </div>

        {/* Transcription Sidebar */}
        <aside className="w-96 border-l border-brand-border flex flex-col glass">
          <div className="p-6 border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-brand-accent" />
              <h2 className="font-semibold">Live Transcription</h2>
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 bg-brand-border px-2 py-0.5 rounded">POC</span>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
          >
            <AnimatePresence initial={false}>
              {transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center">
                    <Mic size={24} />
                  </div>
                  <p className="text-sm">Transcription will appear here once you start the session.</p>
                </div>
              ) : (
                transcripts.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${item.speaker === 'Interviewer' ? 'text-brand-accent' : 'text-emerald-500'}`}>
                        {item.speaker}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className={`p-3 rounded-xl text-sm leading-relaxed ${item.speaker === 'Interviewer' ? 'bg-brand-accent/5 border border-brand-accent/10' : 'bg-emerald-500/5 border border-emerald-500/10'}`}>
                      {item.text}
                      {!item.isFinal && <span className="inline-block w-1 h-4 ml-1 bg-brand-accent animate-pulse align-middle"></span>}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 bg-brand-bg/50 border-t border-brand-border">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-card border border-brand-border">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Terminal size={16} className="text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Engine Status</p>
                <p className="text-xs truncate">Gemini Live Audio Processing</p>
              </div>
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
