import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, HostedFile } from '../lib/supabase';
import { Server, Upload, File, Trash2, LogOut, Globe, HardDrive, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<HostedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    loadFiles();
  }, [user, authLoading, navigate]);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('hosted_files')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      for (const file of Array.from(selectedFiles)) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large (max 10MB)`);
        }

        if (user!.storage_used + file.size > user!.storage_limit) {
          throw new Error('Storage limit exceeded');
        }

        const isBinary = file.type.startsWith('image/') ||
                        file.type === 'application/octet-stream' ||
                        file.type === 'application/pdf';

        let content: string;
        if (isBinary) {
          const buffer = await file.arrayBuffer();
          content = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        } else {
          content = await file.text();
        }

        const filePath = `/${file.name}`;

        const { error: uploadError } = await supabase
          .from('hosted_files')
          .upsert({
            user_id: user!.id,
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
            content,
            is_binary: isBinary,
          });

        if (uploadError) throw uploadError;

        const { error: updateError } = await supabase
          .from('users')
          .update({ storage_used: user!.storage_used + file.size })
          .eq('id', user!.id);

        if (updateError) throw updateError;
      }

      setSuccess('Files uploaded successfully!');
      await refreshUser();
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (file: HostedFile) => {
    if (!confirm(`Delete ${file.file_name}?`)) return;

    try {
      const { error: deleteError } = await supabase
        .from('hosted_files')
        .delete()
        .eq('id', file.id);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from('users')
        .update({ storage_used: user!.storage_used - file.file_size })
        .eq('id', user!.id);

      if (updateError) throw updateError;

      setSuccess('File deleted successfully!');
      await refreshUser();
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Server className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">VBI ProxyHost</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Manage your hosted files</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Your Site URL</h3>
            </div>
            <p className="text-sm text-slate-600 break-all">
              {user.username}.vbiproxyhost.com
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <HardDrive className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-900">Storage Used</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatBytes(user.storage_used)}
            </p>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${(user.storage_used / user.storage_limit) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {formatBytes(user.storage_limit)} total
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <File className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-slate-900">Files</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">{files.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Files</h2>
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              <span>{uploading ? 'Uploading...' : 'Upload Files'}</span>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {loading ? (
            <p className="text-slate-600 text-center py-8">Loading files...</p>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <File className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-2">No files uploaded yet</p>
              <p className="text-sm text-slate-500">Upload an index.html file to get started</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{file.file_name}</p>
                      <p className="text-xs text-slate-500">
                        {formatBytes(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file)}
                    className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
