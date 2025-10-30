import ChatBot from '@/components/ChatBot'
import type { AssetFormData } from '@/components/AssetInput'

export default function ConsultPage({
  data,
  setData,
  step,
  setStep,
  incomeRecognition,
  eligibility,
  navigate,
}: {
  data: AssetFormData,
  setData: (v: AssetFormData) => void,
  step: 0 | 1 | 2,
  setStep: (s: 0 | 1 | 2) => void,
  incomeRecognition: { total: number; perCapita: number },
  eligibility: { baseEligible: boolean; microFinanceEligible: boolean },
  navigate: (p: string) => void,
}) {
  return (
    <div className="container">
      <ChatBot
        data={data}
        setData={setData}
        step={step}
        setStep={setStep}
        incomeRecognition={incomeRecognition}
        eligibility={eligibility}
        fullscreen
        onExit={() => navigate('/')}
      />
    </div>
  )
}
