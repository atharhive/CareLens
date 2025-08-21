export const validateAge = (age?: number): string | null => {
  if (age == null || Number.isNaN(age)) return "Age is required"
  if (age < 0 || age > 100) return "Age must be between 0 and 100"
  if (age < 18) return "This assessment is designed for adults 18 and older"
  return null
}

export const validateHeight = (height?: number, unit: "cm" | "ft" = "cm"): string | null => {
  if (height == null || Number.isNaN(height)) return "Height is required"
  if (unit === "cm") {
    if (height < 100 || height > 250) return "Height must be between 100-250 cm"
  } else {
    if (height < 3 || height > 8) return "Height must be between 3-8 feet"
  }
  return null
}

export const validateWeight = (weight?: number, unit: "kg" | "lbs" = "kg"): string | null => {
  if (weight == null || Number.isNaN(weight)) return "Weight is required"
  if (unit === "kg") {
    if (weight < 30 || weight > 300) return "Weight must be between 30-300 kg"
  } else {
    if (weight < 66 || weight > 660) return "Weight must be between 66-660 lbs"
  }
  return null
}

export const validateBloodPressure = (systolic: number, diastolic: number): string | null => {
  if (systolic < 70 || systolic > 250) return "Systolic BP must be between 70-250 mmHg"
  if (diastolic < 40 || diastolic > 150) return "Diastolic BP must be between 40-150 mmHg"
  if (systolic <= diastolic) return "Systolic BP must be higher than diastolic BP"
  return null
}

export const validateHeartRate = (heartRate?: number): string | null => {
  if (heartRate == null || Number.isNaN(heartRate)) return null
  if (heartRate < 30 || heartRate > 220) return "Heart rate must be between 30-220 bpm"
  return null
}

export const validateTemperature = (temp?: number, unit: "celsius" | "fahrenheit" = "celsius"): string | null => {
  if (temp == null || Number.isNaN(temp)) return null
  if (unit === "celsius") {
    if (temp < 30 || temp > 45) return "Temperature must be between 30-45°C"
  } else {
    if (temp < 86 || temp > 113) return "Temperature must be between 86-113°F"
  }
  return null
}
