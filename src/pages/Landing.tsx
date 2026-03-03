import { Link } from 'react-router-dom';
import { Server, Zap, Shield, Globe } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Server className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">VBI ProxyHost</span>
            </div>
            <div className="flex gap-4">
              <Link to="/login" className="px-4 py-2 text-slate-700 hover:text-slate-900">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">
              Free Static Website Hosting
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Deploy your static sites instantly with custom subdomains. Fast, secure, and completely free.
            </p>
            <Link to="/register" className="inline-block px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors">
              Start Hosting Now
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Custom Subdomains</h3>
              <p className="text-slate-600">Get your own subdomain like username.vbiproxyhost.com for your site</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Server className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">100MB Storage</h3>
              <p className="text-slate-600">Store up to 100MB of static files completely free</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Lightning Fast</h3>
              <p className="text-slate-600">Global edge network ensures fast delivery worldwide</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Secure</h3>
              <p className="text-slate-600">HTTPS enabled by default with enterprise-grade security</p>
            </div>
          </div>

          <div className="mt-20 bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                <h3 className="font-semibold text-slate-900 mb-2">Create Account</h3>
                <p className="text-slate-600">Sign up with your email and choose a unique username</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                <h3 className="font-semibold text-slate-900 mb-2">Upload Files</h3>
                <p className="text-slate-600">Upload your HTML, CSS, and JavaScript files</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                <h3 className="font-semibold text-slate-900 mb-2">Go Live</h3>
                <p className="text-slate-600">Your site is instantly available at your custom subdomain</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-slate-600">VBI ProxyHost - Free Static Website Hosting</p>
        </div>
      </footer>
    </div>
  );
}
