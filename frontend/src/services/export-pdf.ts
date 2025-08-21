"use client"

import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export async function exportElementToPDF(elementId: string, filename = "carelens-results.pdf") {
	const element = document.getElementById(elementId)
	if (!element) throw new Error(`Element with id "${elementId}" not found`)

	const canvas = await html2canvas(element, {
		scale: 2,
		useCORS: true,
		backgroundColor: "#ffffff",
		onclone: (doc) => {
			// Force white background and strip gradients that may use oklch()
			const root = doc.getElementById(elementId) as HTMLElement | null
			if (!root) return
			// Set a clean background for root
			root.style.background = "#ffffff"
			// Traverse descendants and neutralize backgrounds that could use gradients/oklch
			root.querySelectorAll<HTMLElement>("*").forEach((el) => {
				const style = doc.defaultView?.getComputedStyle(el)
				if (!style) return
				// Remove gradient images
				if (style.backgroundImage && style.backgroundImage !== "none") {
					el.style.backgroundImage = "none"
				}
				// Normalize any non-sRGB background colors
				const bg = style.backgroundColor || ""
				if (bg.includes("oklch") || bg.includes("lch(")) {
					el.style.backgroundColor = "#ffffff"
				}
			})
		},
		windowWidth: element.scrollWidth,
		windowHeight: element.scrollHeight,
	})

	const imgData = canvas.toDataURL("image/png")
	const pdf = new jsPDF("p", "mm", "a4")

	const pageWidth = pdf.internal.pageSize.getWidth()
	const pageHeight = pdf.internal.pageSize.getHeight()

	const imgWidth = pageWidth
	const imgHeight = (canvas.height * imgWidth) / canvas.width

	let heightLeft = imgHeight
	let position = 0

	pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
	heightLeft -= pageHeight

	while (heightLeft > 0) {
		position = heightLeft - imgHeight
		pdf.addPage()
		pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
		heightLeft -= pageHeight
	}

	pdf.save(filename)
} 