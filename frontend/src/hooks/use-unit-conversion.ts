"use client"

import { useState, useCallback } from "react"
import { convertHeight, convertWeight, convertTemperature } from "@/utils/conversions"

export function useUnitConversion() {
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm")
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg")
  const [temperatureUnit, setTemperatureUnit] = useState<"celsius" | "fahrenheit">("celsius")

  const convertHeightValue = useCallback((value: number, fromUnit: "cm" | "ft", toUnit: "cm" | "ft") => {
    return convertHeight(value, fromUnit, toUnit)
  }, [])

  const convertWeightValue = useCallback((value: number, fromUnit: "kg" | "lbs", toUnit: "kg" | "lbs") => {
    return convertWeight(value, fromUnit, toUnit)
  }, [])

  const convertTemperatureValue = useCallback(
    (value: number, fromUnit: "celsius" | "fahrenheit", toUnit: "celsius" | "fahrenheit") => {
      return convertTemperature(value, fromUnit, toUnit)
    },
    [],
  )

  const toggleHeightUnit = useCallback(() => {
    setHeightUnit((prev) => (prev === "cm" ? "ft" : "cm"))
  }, [])

  const toggleWeightUnit = useCallback(() => {
    setWeightUnit((prev) => (prev === "kg" ? "lbs" : "kg"))
  }, [])

  const toggleTemperatureUnit = useCallback(() => {
    setTemperatureUnit((prev) => (prev === "celsius" ? "fahrenheit" : "celsius"))
  }, [])

  return {
    heightUnit,
    weightUnit,
    temperatureUnit,
    setHeightUnit,
    setWeightUnit,
    setTemperatureUnit,
    convertHeightValue,
    convertWeightValue,
    convertTemperatureValue,
    toggleHeightUnit,
    toggleWeightUnit,
    toggleTemperatureUnit,
  }
}
