
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

interface NavbarProps {
  userRole?: 'admin' | 'user';
  userName?: string;
}

const Navbar = ({ userRole = 'user', userName = 'Usuário' }: NavbarProps) => {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-sm sticky top-0 z-30 transition-colors">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-2 md:px-8 lg:px-12 min-h-[72px]">
        {/* Logo e Título */}
        <div className="flex items-center gap-5 md:gap-7 lg:gap-10">
          <img 
            src="https://thiagocosac.com.br/wp-content/uploads/2025/06/ID-VISUAL-VGV_Prancheta-1.png"
            alt="Mais VGV Logo"
            className="h-10 w-auto object-contain drop-shadow-sm"
            loading="lazy"
          />
          <div className="flex flex-col justify-center">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">Radar de Cobrança VGV</h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-tight">Sistema de Gestão de Inadimplência</p>
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4 md:gap-6 lg:gap-8">
          {/* Botão de alternância de tema */}
          <button
            aria-label="Alternar tema"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" />
            )}
          </button>
          {/* Notifications */}
          <NotificationBell />
          <div className="text-right min-w-[90px]">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">{userName}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 capitalize truncate max-w-[140px]">
              {userRole === 'admin' ? 'Administrador' : 'Assistente de Cobrança'}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full focus:ring-2 focus:ring-blue-400">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                    {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" align="end" forceMount>
              <DropdownMenuItem className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                <User className="w-4 h-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                <Settings className="w-4 h-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
