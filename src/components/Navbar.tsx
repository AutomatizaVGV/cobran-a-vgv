
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';
import NotificationBell from './NotificationBell';

interface NavbarProps {
  userRole?: 'admin' | 'user';
  userName?: string;
}

const Navbar = ({ userRole = 'user', userName = 'Usuário' }: NavbarProps) => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="https://thiagocosac.com.br/wp-content/uploads/2025/06/ID-VISUAL-VGV_Prancheta-1.png"
            alt="Mais VGV Logo"
            className="h-10 w-auto object-contain"
            loading="lazy"
          />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Radar de Cobrança VGV</h1>
            <p className="text-sm text-slate-600">Sistema de Gestão de Inadimplência</p>
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationBell />
          
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{userName}</p>
            <p className="text-xs text-slate-600 capitalize">
              {userRole === 'admin' ? 'Administrador' : 'Assistente de Cobrança'}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                    {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white border border-slate-200" align="end" forceMount>
              <DropdownMenuItem className="flex items-center gap-2 hover:bg-slate-50">
                <User className="w-4 h-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 hover:bg-slate-50">
                <Settings className="w-4 h-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex items-center gap-2 text-red-600 hover:bg-red-50"
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
