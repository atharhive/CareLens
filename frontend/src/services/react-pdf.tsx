import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
	page: { padding: 24 },
	title: { fontSize: 18, marginBottom: 8, fontWeight: 'bold' },
	subtitle: { fontSize: 12, color: '#555', marginBottom: 12 },
	section: { marginBottom: 16 },
	row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
	label: { fontSize: 10, color: '#666' },
	value: { fontSize: 12 },
	chip: { fontSize: 10, padding: 4, backgroundColor: '#eee', borderRadius: 4, marginRight: 4, marginBottom: 4 },
})

export function ResultsPdfDoc(props: {
	meta: { age?: number; sex?: string; date: string }
	summary: { conditionsAnalyzed: number; avgRiskPct: number; highRiskCount: number; actionCount: number }
	risks: Array<{ name: string; scorePct: number; category: string }>
	highRisk: Array<{ name: string; scorePct: number }>
	triage?: { urgency: string; timeframe: string }
	recommendations?: { immediate?: Array<{ title: string; timeframe?: string }>; followUp?: Array<{ title: string; timeframe?: string }> }
}) {
	const { meta, summary, risks, highRisk, triage, recommendations } = props
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.section}>
					<Text style={styles.title}>CareLens Health Risk Assessment</Text>
					<Text style={styles.subtitle}>
						Generated on {meta.date}{meta.age ? ` • Age ${meta.age}` : ''}{meta.sex ? ` • ${meta.sex}` : ''}
					</Text>
				</View>

				<View style={styles.section}>
					<Text style={styles.subtitle}>Summary</Text>
					<View style={styles.row}><Text style={styles.label}>Conditions Analyzed</Text><Text style={styles.value}>{summary.conditionsAnalyzed}</Text></View>
					<View style={styles.row}><Text style={styles.label}>Average Risk</Text><Text style={styles.value}>{summary.avgRiskPct}%</Text></View>
					<View style={styles.row}><Text style={styles.label}>High Risk Conditions</Text><Text style={styles.value}>{summary.highRiskCount}</Text></View>
					<View style={styles.row}><Text style={styles.label}>Recommended Actions</Text><Text style={styles.value}>{summary.actionCount}</Text></View>
				</View>

				<View style={styles.section}>
					<Text style={styles.subtitle}>Risk Scores</Text>
					{risks.map((r) => (
						<View key={r.name} style={styles.row}>
							<Text style={styles.value}>{r.name}</Text>
							<Text style={styles.value}>{r.scorePct}% ({r.category})</Text>
						</View>
					))}
				</View>

				{highRisk.length > 0 ? (
					<View style={styles.section}>
						<Text style={styles.subtitle}>High Risk Conditions</Text>
						{highRisk.map((h) => (
							<View key={h.name} style={styles.row}>
								<Text style={styles.value}>{h.name}</Text>
								<Text style={styles.value}>{h.scorePct}%</Text>
							</View>
						))}
					</View>
				) : null}

				{triage ? (
					<View style={styles.section}>
						<Text style={styles.subtitle}>Triage</Text>
						<View style={styles.row}><Text style={styles.value}>{triage.urgency.toUpperCase()}</Text><Text style={styles.value}>{triage.timeframe}</Text></View>
					</View>
				) : null}

				{recommendations ? (
					<View style={styles.section}>
						<Text style={styles.subtitle}>Next Steps</Text>
						{recommendations.immediate?.map((a, idx) => (
							<View key={`imm-${idx}`} style={styles.row}><Text style={styles.value}>{a.title}</Text><Text style={styles.label}>{a.timeframe || ''}</Text></View>
						))}
						{recommendations.followUp?.map((f, idx) => (
							<View key={`fu-${idx}`} style={styles.row}><Text style={styles.value}>{f.title}</Text><Text style={styles.label}>{f.timeframe || ''}</Text></View>
						))}
					</View>
				) : null}
			</Page>
		</Document>
	)
}