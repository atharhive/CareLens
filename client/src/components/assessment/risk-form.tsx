import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAssessmentStore } from "@/store/assessment";
import { 
  demographicDataSchema, 
  vitalSignsSchema, 
  medicalHistorySchema, 
  symptomsSchema 
} from "@shared/schema";
import type { AssessmentStep } from "@/types/assessment";
import { useEffect } from "react";

interface RiskFormProps {
  step: AssessmentStep;
}

export default function RiskForm({ step }: RiskFormProps) {
  const {
    demographicData,
    vitalSigns,
    medicalHistory,
    symptoms,
    updateDemographicData,
    updateVitalSigns,
    updateMedicalHistory,
    updateSymptoms
  } = useAssessmentStore();

  // Demographics Form
  const demographicsForm = useForm({
    resolver: zodResolver(demographicDataSchema),
    defaultValues: demographicData,
  });

  // Vital Signs Form
  const vitalsForm = useForm({
    resolver: zodResolver(vitalSignsSchema),
    defaultValues: vitalSigns,
  });

  // Medical History Form
  const historyForm = useForm({
    resolver: zodResolver(medicalHistorySchema),
    defaultValues: {
      smoking: 'never',
      alcohol: 'none',
      exercise: 'sedentary',
      currentConditions: [],
      currentMedications: [],
      familyHistory: [],
      ...medicalHistory,
    },
  });

  // Symptoms Form
  const symptomsForm = useForm({
    resolver: zodResolver(symptomsSchema),
    defaultValues: {
      chestPain: false,
      shortnessOfBreath: false,
      fatigue: false,
      frequentUrination: false,
      excessiveThirst: false,
      weightLoss: false,
      dizziness: false,
      palpitations: false,
      ...symptoms,
    },
  });

  // Update store when form values change
  useEffect(() => {
    const subscription = demographicsForm.watch((values) => {
      updateDemographicData(values);
    });
    return () => subscription.unsubscribe();
  }, [demographicsForm.watch, updateDemographicData]);

  useEffect(() => {
    const subscription = vitalsForm.watch((values) => {
      updateVitalSigns(values);
    });
    return () => subscription.unsubscribe();
  }, [vitalsForm.watch, updateVitalSigns]);

  useEffect(() => {
    const subscription = historyForm.watch((values) => {
      updateMedicalHistory(values);
    });
    return () => subscription.unsubscribe();
  }, [historyForm.watch, updateMedicalHistory]);

  useEffect(() => {
    const subscription = symptomsForm.watch((values) => {
      updateSymptoms(values);
    });
    return () => subscription.unsubscribe();
  }, [symptomsForm.watch, updateSymptoms]);

  if (step === 'demographics') {
    return (
      <Form {...demographicsForm}>
        <form className="medical-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={demographicsForm.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter your age"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={demographicsForm.control}
              name="sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sex *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={demographicsForm.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height (cm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g., 175"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    Used to calculate BMI if provided
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={demographicsForm.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g., 70"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    Used to calculate BMI if provided
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={demographicsForm.control}
              name="ethnicity"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Ethnicity (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Hispanic, Asian, Caucasian"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Some conditions have ethnic variations in risk factors
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    );
  }

  if (step === 'vitals') {
    return (
      <Form {...vitalsForm}>
        <form className="medical-form">
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg">Recent Measurements</CardTitle>
              <CardDescription>
                Use measurements from the past 3 months for best accuracy. All fields are optional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={vitalsForm.control}
                  name="systolicBP"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Systolic Blood Pressure</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g., 120"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Top number (normal: 90-120)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={vitalsForm.control}
                  name="diastolicBP"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diastolic Blood Pressure</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g., 80"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Bottom number (normal: 60-80)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={vitalsForm.control}
                  name="heartRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resting Heart Rate</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g., 72"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Beats per minute (normal: 60-100)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={vitalsForm.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Temperature (°F)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="e.g., 98.6"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Normal: 97-99°F
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    );
  }

  if (step === 'history') {
    return (
      <Form {...historyForm}>
        <form className="medical-form">
          <div className="space-y-8">
            {/* Lifestyle Factors */}
            <Card>
              <CardHeader>
                <CardTitle>Lifestyle Factors</CardTitle>
                <CardDescription>
                  These factors significantly impact health risk calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={historyForm.control}
                    name="smoking"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Smoking Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="never">Never smoked</SelectItem>
                            <SelectItem value="former">Former smoker</SelectItem>
                            <SelectItem value="current">Current smoker</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={historyForm.control}
                    name="alcohol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alcohol Consumption *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select consumption" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="light">Light (1-3 drinks/week)</SelectItem>
                            <SelectItem value="moderate">Moderate (4-14 drinks/week)</SelectItem>
                            <SelectItem value="heavy">Heavy ({'>'}14 drinks/week)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={historyForm.control}
                    name="exercise"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exercise Level *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sedentary">Sedentary</SelectItem>
                            <SelectItem value="light">Light activity</SelectItem>
                            <SelectItem value="moderate">Moderate (150 min/week)</SelectItem>
                            <SelectItem value="active">Very active ({'>'}300 min/week)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={historyForm.control}
                name="currentConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Medical Conditions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Hypertension, Type 2 Diabetes, High Cholesterol (one per line)"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                        value={Array.isArray(field.value) ? field.value.join('\n') : ''}
                      />
                    </FormControl>
                    <FormDescription>
                      List any diagnosed medical conditions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={historyForm.control}
                name="currentMedications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Medications</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Metformin 500mg, Lisinopril 10mg (one per line)"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                        value={Array.isArray(field.value) ? field.value.join('\n') : ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Include prescription and over-the-counter medications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={historyForm.control}
                name="familyHistory"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Family History</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Father - Heart Disease, Mother - Diabetes (one per line)"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                        value={Array.isArray(field.value) ? field.value.join('\n') : ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Medical conditions in parents and siblings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    );
  }

  if (step === 'symptoms') {
    const symptomsList = [
      { key: 'chestPain', label: 'Chest pain or discomfort', description: 'Any chest pain, pressure, or discomfort' },
      { key: 'shortnessOfBreath', label: 'Shortness of breath', description: 'Difficulty breathing or feeling winded' },
      { key: 'fatigue', label: 'Unusual fatigue', description: 'More tired than usual without clear reason' },
      { key: 'frequentUrination', label: 'Frequent urination', description: 'Urinating more often than normal' },
      { key: 'excessiveThirst', label: 'Excessive thirst', description: 'Feeling thirsty despite drinking fluids' },
      { key: 'weightLoss', label: 'Unexplained weight loss/gain', description: 'Weight changes without diet changes' },
      { key: 'dizziness', label: 'Dizziness or lightheadedness', description: 'Feeling dizzy or faint' },
      { key: 'palpitations', label: 'Heart palpitations', description: 'Feeling your heart racing or skipping beats' },
    ];

    return (
      <Form {...symptomsForm}>
        <form className="medical-form">
          <Card>
            <CardHeader>
              <CardTitle>Current Symptoms</CardTitle>
              <CardDescription>
                Check any symptoms you've experienced in the past 2 weeks. All symptoms are optional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {symptomsList.map((symptom) => (
                  <FormField
                    key={symptom.key}
                    control={symptomsForm.control}
                    name={symptom.key as keyof typeof symptoms}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium">
                            {symptom.label}
                          </FormLabel>
                          <FormDescription className="text-xs">
                            {symptom.description}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    );
  }

  if (step === 'review') {
    const progress = useAssessmentStore.getState().getProgress();
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Summary</CardTitle>
            <CardDescription>
              Review your information before running the AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Demographics Summary */}
              {Object.keys(demographicData).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Demographics</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    {demographicData.age && <div>Age: {demographicData.age}</div>}
                    {demographicData.sex && <div>Sex: {demographicData.sex}</div>}
                    {demographicData.height && demographicData.weight && (
                      <div>BMI: {((demographicData.weight / (demographicData.height / 100) ** 2)).toFixed(1)}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Vital Signs Summary */}
              {Object.keys(vitalSigns).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Vital Signs</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    {vitalSigns.systolicBP && vitalSigns.diastolicBP && (
                      <div>Blood Pressure: {vitalSigns.systolicBP}/{vitalSigns.diastolicBP}</div>
                    )}
                    {vitalSigns.heartRate && <div>Heart Rate: {vitalSigns.heartRate} bpm</div>}
                  </div>
                </div>
              )}

              {/* Lifestyle Summary */}
              {Object.keys(medicalHistory).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Lifestyle</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    {medicalHistory.smoking && <div>Smoking: {medicalHistory.smoking}</div>}
                    {medicalHistory.alcohol && <div>Alcohol: {medicalHistory.alcohol}</div>}
                    {medicalHistory.exercise && <div>Exercise: {medicalHistory.exercise}</div>}
                  </div>
                </div>
              )}

              {/* Symptoms Summary */}
              {Object.values(symptoms).some(Boolean) && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Symptoms</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {Object.entries(symptoms)
                      .filter(([_, value]) => value)
                      .map(([key, _]) => key)
                      .join(', ')}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Ready for Analysis
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your assessment is {Math.round((progress.completed_steps.length / progress.total_steps) * 100)}% complete. 
                The AI will analyze your data using specialized medical models to provide personalized risk scores and recommendations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
