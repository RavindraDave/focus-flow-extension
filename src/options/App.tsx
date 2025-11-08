import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">
          Focus Flow - Settings
        </h1>
      </header>

      <main className="max-w-4xl mx-auto">
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Configuration
          </h2>
          <p className="text-neutral-600">
            Options page ready for configuration settings.
          </p>
        </section>
      </main>
    </div>
  );
};

export default App;
