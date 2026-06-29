'use client';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Shell({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}
