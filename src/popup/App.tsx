import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Focus Flow</h1>
      </header>

      <main className="space-y-6">
        <section className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-neutral-600">
            Extension infrastructure ready. Start building features!
          </p>
        </section>
      </main>
    </div>
  );
};

export default App;
