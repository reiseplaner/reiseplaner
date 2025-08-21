import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
      <div className="flex justify-center">
        <div className="w-full max-w-5xl px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            <div className="text-xl font-bold text-gray-900">
              ReiseVeteran
            </div>
            <span className="text-gray-500">|</span>
            <span className="text-gray-600 text-sm">
              Ihre Reise beginnt hier
            </span>
          </div>
          
          {/* Links */}
          <div className="flex items-center space-x-6 text-sm">
            <Link href="/impressum" className="text-gray-600 hover:text-gray-900 transition-colors">
              Impressum
            </Link>
            <Link href="/datenschutz" className="text-gray-600 hover:text-gray-900 transition-colors">
              Datenschutz
            </Link>
            <Link href="/cookie-einstellungen" className="text-gray-600 hover:text-gray-900 transition-colors">
              Cookie-Einstellungen
            </Link>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">
              © {new Date().getFullYear()} Kuhn Marketing
            </span>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
          <p>
            Planen Sie Ihre Traumreise mit unserer innovativen Reiseplanungsplattform. 
            Entdecken Sie neue Orte, organisieren Sie Aktivitäten und teilen Sie Ihre Erlebnisse.
          </p>
        </div>
        </div>
      </div>
    </footer>
  );
} 