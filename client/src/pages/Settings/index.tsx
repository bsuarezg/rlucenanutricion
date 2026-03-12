import { useState } from 'react';
import { Settings as SettingsIcon, Calculator, Database } from 'lucide-react';

import GeneralSettings from './GeneralSettings';
import FormulasSettings from './FormulasSettings';
import ConstantsSettings from './ConstantsSettings';

const TABS = [
  { id: 'general', label: 'General', icon: SettingsIcon, component: GeneralSettings },
  { id: 'formulas', label: 'Fórmulas', icon: Calculator, component: FormulasSettings },
  { id: 'constants', label: 'Constantes', icon: Database, component: ConstantsSettings },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component || GeneralSettings;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Configuración Avanzada</h1>
        <p className="mt-2 text-sm text-gray-700">
          Gestiona los ajustes generales, las fórmulas matemáticas del sistema y las tablas de constantes.
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap flex py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${
                    isActive ? 'text-indigo-500' : 'text-gray-400'
                  }`}
                  aria-hidden="true"
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        <ActiveComponent />
      </div>
    </div>
  );
}
