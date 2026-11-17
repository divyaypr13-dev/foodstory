import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  PlusSquare,
  Bookmark,
  User,
  MessageCircle,
  Sparkles,
  Utensils,
  Store,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `whitespace-nowrap shrink-0 text-sm font-medium transition-colors pb-0.5 ${
      isActive
        ? 'text-[#E23E3E] border-b-2 border-[#E23E3E]'
        : 'text-[#1F1B16]/75 hover:text-[#1F1B16]'
    }`;

  return (
    <>
      {/* Desktop & Mobile Top Bar (strict 3-zone contract) */}
      <header className="sticky top-0 z-40 bg-[#FFF8F2]/92 backdrop-blur-md border-b border-[#1F1B16]/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark */}
          <Link
            to="/"
            className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#1F1B16] whitespace-nowrap shrink-0"
          >
            Food<span className="text-[#E23E3E]">Story</span>
          </Link>

          {/* Zone 2: 5 concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={navLinkClass}>
              Feed
            </NavLink>
            <NavLink to="/discover" className={navLinkClass}>
              Discover
            </NavLink>
            <NavLink to="/dishes" className={navLinkClass}>
              Dishes
            </NavLink>
            <NavLink to="/ai" className={navLinkClass}>
              For You
            </NavLink>
            <NavLink to="/saved" className={navLinkClass}>
              Saved
            </NavLink>
          </nav>

          {/* Zone 3: Single primary action / user menu */}
          <div className="flex items-center gap-3 shrink-0 relative">
            {!user ? (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-[#E23E3E] text-white text-sm font-medium hover:bg-[#c83232] transition-colors whitespace-nowrap shrink-0 min-h-[40px] flex items-center"
              >
                Sign In
              </Link>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-sm border border-[#1F1B16]/8 hover:border-[#1F1B16]/20 transition-colors min-h-[40px] cursor-pointer"
                >
                  <span className="w-7 h-7 rounded-full bg-[#E23E3E]/12 text-[#E23E3E] font-semibold text-xs flex items-center justify-center shrink-0">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <span className="text-sm font-medium text-[#1F1B16] max-w-[110px] truncate hidden sm:inline">
                    {user.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#1F1B16]/60" />
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#1F1B16]/8 py-2 z-50">
                      <div className="px-4 py-2 border-b border-[#1F1B16]/8">
                        <p className="text-sm font-semibold text-[#1F1B16] truncate">{user.name}</p>
                        <p className="text-xs text-[#1F1B16]/60 truncate">
                          @{user.username} · {user.role}
                        </p>
                      </div>

                      <Link
                        to="/chat"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1F1B16] hover:bg-[#FFF8F2] transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-[#E23E3E]" />
                        Messages
                      </Link>
                      <Link
                        to="/ai"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1F1B16] hover:bg-[#FFF8F2] transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-[#FFB020]" />
                        Smart Picks
                      </Link>
                      <Link
                        to="/dishes"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1F1B16] hover:bg-[#FFF8F2] transition-colors md:hidden"
                      >
                        <Utensils className="w-4 h-4 text-[#1F1B16]/70" />
                        Search Dishes
                      </Link>

                      {(user.role === 'owner' || user.role === 'admin') && (
                        <Link
                          to="/owner"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1F1B16] hover:bg-[#FFF8F2] transition-colors"
                        >
                          <Store className="w-4 h-4 text-[#2E7D32]" />
                          Owner Studio
                        </Link>
                      )}

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1F1B16] hover:bg-[#FFF8F2] transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#E23E3E]" />
                          Admin Console
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1F1B16] hover:bg-[#FFF8F2] transition-colors"
                      >
                        <User className="w-4 h-4 text-[#1F1B16]/70" />
                        My Profile
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#B71C1C] hover:bg-[#FFF8F2] transition-colors cursor-pointer border-t border-[#1F1B16]/8 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (Home, Discover, Create, Saved, Profile) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#1F1B16]/10"
      >
        <div className="grid grid-cols-5 h-[60px] items-center">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[44px] text-[10px] font-medium ${
                isActive ? 'text-[#E23E3E]' : 'text-[#1F1B16]/65'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span className="mt-0.5">Home</span>
          </NavLink>

          <NavLink
            to="/discover"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[44px] text-[10px] font-medium ${
                isActive ? 'text-[#E23E3E]' : 'text-[#1F1B16]/65'
              }`
            }
          >
            <Compass className="w-5 h-5" />
            <span className="mt-0.5">Discover</span>
          </NavLink>

          <NavLink
            to="/?compose=1"
            className="flex flex-col items-center justify-center min-h-[44px] text-[10px] font-medium text-[#E23E3E]"
          >
            <PlusSquare className="w-6 h-6" />
            <span className="mt-0.5">Create</span>
          </NavLink>

          <NavLink
            to="/saved"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[44px] text-[10px] font-medium ${
                isActive ? 'text-[#E23E3E]' : 'text-[#1F1B16]/65'
              }`
            }
          >
            <Bookmark className="w-5 h-5" />
            <span className="mt-0.5">Saved</span>
          </NavLink>

          <NavLink
            to={user ? '/profile' : '/login'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[44px] text-[10px] font-medium ${
                isActive ? 'text-[#E23E3E]' : 'text-[#1F1B16]/65'
              }`
            }
          >
            <User className="w-5 h-5" />
            <span className="mt-0.5">Profile</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
}
