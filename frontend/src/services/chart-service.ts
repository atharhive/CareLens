"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartConfiguration,
} from "chart.js"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

export interface RiskChartData {
  condition: string
  score: number
  category: "low" | "moderate" | "high" | "critical"
  confidence: number
}

export interface ContributionChartData {
  feature: string
  impact: number
  direction: "positive" | "negative"
}

export class ChartService {
  // Create risk scores bar chart
  static createRiskScoresChart(data: RiskChartData[]): ChartConfiguration {
    const colors = data.map((item) => {
      switch (item.category) {
        case "low":
          return "#10b981" // green
        case "moderate":
          return "#f59e0b" // yellow
        case "high":
          return "#f97316" // orange
        case "critical":
          return "#ef4444" // red
        default:
          return "#6b7280" // gray
      }
    })

    return {
      type: "bar",
      data: {
        labels: data.map((item) => item.condition),
        datasets: [
          {
            label: "Risk Score (%)",
            data: data.map((item) => Math.round(item.score * 100)),
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Health Risk Assessment Results",
            font: {
              size: 16,
              weight: "bold",
            },
          },
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const dataIndex = context.dataIndex
                const item = data[dataIndex]
                return [`Category: ${item.category}`, `Confidence: ${Math.round(item.confidence * 100)}%`]
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: "Risk Score (%)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Health Conditions",
            },
          },
        },
      },
    }
  }

  // Create feature contribution chart
  static createContributionChart(data: ContributionChartData[]): ChartConfiguration {
    const sortedData = [...data].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

    const colors = sortedData.map((item) => (item.direction === "positive" ? "#ef4444" : "#10b981"))

    return {
      type: "bar",
      data: {
        labels: sortedData.map((item) => item.feature),
        datasets: [
          {
            label: "Impact",
            data: sortedData.map((item) => item.impact),
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y" as const,
        plugins: {
          title: {
            display: true,
            text: "Feature Contribution Analysis",
            font: {
              size: 16,
              weight: "bold",
            },
          },
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.x
                const direction = value > 0 ? "increases" : "decreases"
                return `${direction} risk by ${Math.abs(value).toFixed(3)}`
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Impact on Risk",
            },
          },
        },
      },
    }
  }

  // Create risk distribution pie chart
  static createRiskDistributionChart(data: RiskChartData[]): ChartConfiguration {
    const categoryCount = data.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      type: "doughnut",
      data: {
        labels: Object.keys(categoryCount).map((key) => `${key} Risk`),
        datasets: [
          {
            data: Object.values(categoryCount),
            backgroundColor: ["#10b981", "#f59e0b", "#f97316", "#ef4444"],
            borderColor: ["#059669", "#d97706", "#ea580c", "#dc2626"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Risk Category Distribution",
            font: {
              size: 16,
              weight: "bold",
            },
          },
          legend: {
            position: "bottom",
          },
        },
      },
    }
  }

  // Create trend line chart (for historical data)
  static createTrendChart(
    data: Array<{ date: string; value: number }>,
    label: string,
    color = "#059669",
  ): ChartConfiguration {
    return {
      type: "line",
      data: {
        labels: data.map((item) => item.date),
        datasets: [
          {
            label,
            data: data.map((item) => item.value),
            borderColor: color,
            backgroundColor: color + "20",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${label} Trend`,
            font: {
              size: 16,
              weight: "bold",
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: label,
            },
          },
          x: {
            title: {
              display: true,
              text: "Date",
            },
          },
        },
      },
    }
  }
}
