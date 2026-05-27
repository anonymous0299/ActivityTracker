import { useAuth } from '../context/AuthContext';

const Topbar = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-white/[0.04] bg-[#090a0f]/80 backdrop-blur-md px-8" />
  );
};

export default Topbar;