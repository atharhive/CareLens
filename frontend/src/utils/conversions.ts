export const convertHeight = (value: number, from: "cm" | "ft", to: "cm" | "ft"): number => {
  if (from === to) return value

  if (from === "cm" && to === "ft") {
    return Math.round((value / 30.48) * 100) / 100
  } else if (from === "ft" && to === "cm") {
    return Math.round(value * 30.48)
  }

  return value
}

export const convertWeight = (value: number, from: "kg" | "lbs", to: "kg" | "lbs"): number => {
  if (from === to) return value

  if (from === "kg" && to === "lbs") {
    return Math.round(value * 2.20462 * 10) / 10
  } else if (from === "lbs" && to === "kg") {
    return Math.round((value / 2.20462) * 10) / 10
  }

  return value
}

export const convertTemperature = (
  value: number,
  from: "celsius" | "fahrenheit",
  to: "celsius" | "fahrenheit",
): number => {
  if (from === to) return value

  if (from === "celsius" && to === "fahrenheit") {
    return Math.round(((value * 9) / 5 + 32) * 10) / 10
  } else if (from === "fahrenheit" && to === "celsius") {
    return Math.round((((value - 32) * 5) / 9) * 10) / 10
  }

  return value
}

export const calculateBMI = (
  weight: number,
  height: number,
  weightUnit: "kg" | "lbs",
  heightUnit: "cm" | "ft",
): number => {
  // Convert to metric for calculation
  const weightKg = weightUnit === "kg" ? weight : convertWeight(weight, "lbs", "kg")
  const heightCm = heightUnit === "cm" ? height : convertHeight(height, "ft", "cm")
  const heightM = heightCm / 100

  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return "Underweight"
  if (bmi < 25) return "Normal weight"
  if (bmi < 30) return "Overweight"
  return "Obese"
}
