
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';
import Navbar from '@/components/Navbar';

const Index = () => {
  const { user, isLoading, getUserRole } = useAuth();
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      console.log('Index: fetchUserRole chamado', { user: !!user });
      if (user) {
        console.log('Index: Buscando role para user:', user.id);
        const role = await getUserRole();
        console.log('Index: Role obtido:', role);
        setUserRole(role === 'admin' ? 'admin' : 'user');
      }
      setRoleLoading(false);
      console.log('Index: roleLoading definido como false');
    };

    fetchUserRole();
  }, [user, getUserRole]);

  console.log('Index: Estado atual', { 
    isLoading, 
    roleLoading, 
    hasUser: !!user, 
    userRole 
  });

  // Show loading while checking auth or role
  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    console.log('Index: Redirecionando para login - sem usuário');
    return <Login />;
  }

  console.log('Index: Renderizando dashboard para role:', userRole);

  // Show dashboard based on role
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar 
        userRole={userRole} 
        userName={user.email || 'Usuário'}
      />
      
      {userRole === 'admin' ? (
        <AdminDashboard />
      ) : (
        <UserDashboard />
      )}
    </div>
  );
};

export default Index;
