export const interactions = {
  Metoprolol: {
    Amlodipine: {
      severity: 'medium',
      warning: 'May cause excessive blood pressure drop',
    },
    Ibuprofen: {
      severity: 'high',
      warning: 'NSAIDs reduce effectiveness of beta-blockers',
    },
  },
  Metformin: {
    Alcohol: { severity: 'high', warning: 'Risk of lactic acidosis' },
    Ofloxacin: {
      severity: 'medium',
      warning: 'May increase blood sugar instability',
    },
  },
  Ofloxacin: {
    Antacids: {
      severity: 'medium',
      warning: 'Reduces antibiotic absorption — take 2 hrs apart',
    },
  },
}

export const medicationDatabase = [
  { name: 'Metoprolol', category: 'Beta-blocker', commonDose: '25-100mg' },
  { name: 'Lisinopril', category: 'ACE Inhibitor', commonDose: '10-40mg' },
  { name: 'Atorvastatin', category: 'Statin', commonDose: '10-80mg' },
  { name: 'Metformin', category: 'Antidiabetic', commonDose: '500-2000mg' },
  { name: 'Amlodipine', category: 'Calcium Channel Blocker', commonDose: '5-10mg' },
  { name: 'Ofloxacin', category: 'Antibiotic', commonDose: '200-400mg' },
  { name: 'Paracetamol', category: 'Analgesic/Antipyretic', commonDose: '500-1000mg' },
  { name: 'Azithromycin', category: 'Antibiotic', commonDose: '250-500mg' },
  { name: 'Pantoprazole', category: 'PPI', commonDose: '40mg' },
  { name: 'Cetirizine', category: 'Antihistamine', commonDose: '10mg' },
  { name: 'Amoxicillin', category: 'Antibiotic', commonDose: '250-500mg' },
  { name: 'Ibuprofen', category: 'NSAID', commonDose: '400-800mg' },
  { name: 'Omeprazole', category: 'PPI', commonDose: '20-40mg' },
  { name: 'Losartan', category: 'ARB', commonDose: '25-100mg' },
  { name: 'Aspirin', category: 'Antiplatelet', commonDose: '75-325mg' },
]
