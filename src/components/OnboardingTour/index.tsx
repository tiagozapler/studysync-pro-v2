import React from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../../lib/store';

export function OnboardingTour() {
  const { toggleModal, updateSettings } = useAppStore();
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps = [
    {
      title: 'Bienvenido a StudySync Pro',
      content:
        'Tu asistente académico profesional con IA local y almacenamiento offline.',
      icon: '🎓',
    },
    {
      title: 'Gestiona tus cursos',
      content:
        'Agrega, organiza y personaliza tus cursos universitarios con colores únicos.',
      icon: '📚',
    },
    {
      title: 'Sube tus materiales',
      content:
        'PDFs, PPTs, lecturas - todo almacenado de forma segura en tu dispositivo.',
      icon: '📁',
    },
    {
      title: 'Chat con IA (opcional)',
      content: 'Haz preguntas sobre tus materiales usando IA gratuita local.',
      icon: '🤖',
    },
    {
      title: 'Controla tus notas',
      content:
        'Calcula promedios automáticamente y simula escenarios de calificaciones.',
      icon: '📊',
    },
    {
      title: '¡Todo listo!',
      content:
        'Comienza a usar StudySync Pro para organizar tu vida académica.',
      icon: '✨',
    },
  ];

  const handleComplete = () => {
    updateSettings({ onboardingCompleted: true });
    toggleModal('onboarding');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-md">
        <div className="p-6 text-center">
          {/* Skip button */}
          <button
            onClick={handleComplete}
            className="absolute top-4 right-4 p-2 text-dark-text-muted hover:text-dark-text-primary"
          >
            <X size={20} />
          </button>

          {/* Step indicator */}
          <div className="flex justify-center space-x-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-course-blue' : 'bg-dark-border'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="mb-8">
            <div className="text-4xl mb-4">{currentStepData.icon}</div>
            <h2 className="text-xl font-display font-bold text-dark-text-primary mb-4">
              {currentStepData.title}
            </h2>
            <p className="text-dark-text-muted leading-relaxed">
              {currentStepData.content}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="btn btn-ghost disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              Anterior
            </button>

            <span className="text-sm text-dark-text-muted">
              {currentStep + 1} de {steps.length}
            </span>

            <button onClick={handleNext} className="btn btn-primary">
              {currentStep === steps.length - 1 ? 'Comenzar' : 'Siguiente'}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Skip option */}
          <button
            onClick={handleComplete}
            className="mt-4 text-sm text-dark-text-muted hover:text-dark-text-primary underline"
          >
            Saltar tour
          </button>
        </div>
      </div>
    </div>
  );
}
