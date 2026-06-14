import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { SportSelect } from '../components/SportSelect';
import { Upload as UploadIcon, FileVideo, X, CheckCircle } from 'lucide-react';

export default function Upload() {
  const navigate = useNavigate();
  const { user, profile } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sport, setSport] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-m4v'];
    if (!validTypes.includes(file.type)) {
      setError('Please select an MP4 or MOV file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File must be under 100MB');
      return;
    }

    setVideoFile(file);
    setError('');
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const removeFile = () => {
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleUpload = async () => {
    if (!user || !profile || !videoFile) return;
    setError('');

    if (!title.trim()) { setError('Title is required'); return; }
    if (!sport) { setError('Sport is required'); return; }

    setUploading(true);
    setProgress(0);

    try {
      const ext = videoFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;

      // Simulate progress for UX (Supabase JS doesn't have upload progress)
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 15, 90));
      }, 500);

      const { error: uploadError } = await supabase.storage
        .from('highlights')
        .upload(path, videoFile, { upsert: true });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('highlights').getPublicUrl(path);

      const { error: dbError } = await supabase
        .from('highlights')
        .insert({
          profile_id: profile.id,
          title,
          description: description || null,
          video_url: publicUrl,
          sport,
        });

      if (dbError) throw dbError;

      setProgress(100);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-6 md:pt-10 flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Highlight uploaded!</h2>
          <p className="text-text-muted text-sm mb-6">Your video is now live on your profile.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSuccess(false); setTitle(''); setDescription(''); setSport(''); setVideoFile(null); setVideoPreview(null); setProgress(0); }}
              className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Upload another
            </button>
            <button
              onClick={() => navigate(`/profile/${profile?.username}`)}
              className="bg-accent text-primary px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors"
            >
              View profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 md:pt-10 pb-24">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Upload Highlight</h1>

        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 mb-4 text-sm text-error">
            {error}
          </div>
        )}

        {/* Video picker */}
        <div className="mb-6">
          {!videoFile ? (
            <label className="block h-48 md:h-56 bg-surface border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-accent/20 transition-colors">
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <FileVideo className="w-7 h-7 text-accent" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-text">Click to select video</p>
                  <p className="text-xs text-text-muted mt-1">MP4 or MOV, up to 100MB</p>
                </div>
              </div>
              <input
                type="file"
                accept="video/mp4,video/quicktime,.mp4,.mov"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          ) : (
            <div className="relative bg-surface rounded-xl overflow-hidden">
              {videoPreview && (
                <video
                  src={videoPreview}
                  className="w-full h-48 md:h-56 object-contain bg-black"
                  controls
                />
              )}
              <button
                onClick={removeFile}
                disabled={uploading}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Goal vs Barcelona"
              className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 transition-colors"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What happened in this clip?"
              className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 transition-colors resize-none"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Sport</label>
            <SportSelect value={sport} onChange={setSport} disabled={uploading} />
          </div>
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm text-accent font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!videoFile || uploading || !title.trim() || !sport}
          className="w-full mt-6 bg-accent text-primary py-3 rounded-xl text-sm font-bold hover:bg-accent-hover transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <UploadIcon className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload highlight'}
        </button>
      </div>
    </div>
  );
}
