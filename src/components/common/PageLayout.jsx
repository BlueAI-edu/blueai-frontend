import { Navbar } from '@/components/Navbar';

export default function PageLayout({ user, children, maxWidth = 'max-w-7xl', noPadding = false }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className={`${maxWidth} mx-auto ${noPadding ? '' : 'px-6 py-8'}`}>
        {children}
      </div>
    </div>
  );
}
