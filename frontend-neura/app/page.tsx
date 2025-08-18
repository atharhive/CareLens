import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Shield, Users, Brain, FileText, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 to-secondary/5 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  AI-Powered Health Assessment
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold font-serif text-foreground leading-tight">
                  Early Detection,
                  <span className="text-primary"> Better Outcomes</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Advanced AI technology analyzes your health data to detect early risks for diabetes, heart disease,
                  stroke, and more. Get personalized recommendations and connect with healthcare providers.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-lg px-8">
                  <Link href="/assessment">
                    Start Health Assessment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                  Learn More
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  HIPAA Compliant
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Trusted by 50K+ Users
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-primary" />
                  4.9/5 Rating
                </div>
              </div>
            </div>

            <div className="relative">
              <Image
                src="/images/hero-medical.png"
                alt="Healthcare professionals using AI technology"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-serif">Comprehensive Health Risk Assessment</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our AI models analyze multiple health indicators to provide accurate risk assessments for major health
              conditions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <Brain className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">AI Detection</CardTitle>
                <CardDescription>
                  Advanced machine learning models trained on medical data to detect early signs of health risks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Diabetes risk assessment</li>
                  <li>• Cardiovascular disease detection</li>
                  <li>• Stroke risk evaluation</li>
                  <li>• Kidney disease screening</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Care Navigation</CardTitle>
                <CardDescription>
                  Connect with qualified healthcare providers based on your assessment results and location.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Specialist recommendations</li>
                  <li>• Provider search with ratings</li>
                  <li>• Insurance compatibility</li>
                  <li>• Appointment scheduling</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <FileText className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Personalized Plans</CardTitle>
                <CardDescription>
                  Receive tailored health recommendations and actionable steps based on your unique risk profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Lifestyle modifications</li>
                  <li>• Follow-up recommendations</li>
                  <li>• Educational resources</li>
                  <li>• Progress tracking</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-card py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-serif">Proven Results</h2>
            <p className="text-xl text-muted-foreground">
              Our AI models have been validated with real-world medical data
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">94%</div>
              <div className="text-sm text-muted-foreground">Model Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <div className="text-sm text-muted-foreground">Assessments Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">1,200+</div>
              <div className="text-sm text-muted-foreground">Healthcare Providers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <div className="text-sm text-muted-foreground">User Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold font-serif">Take Control of Your Health Today</h2>
          <p className="text-xl text-muted-foreground">
            Start your comprehensive health assessment in just 5 minutes. Early detection can save lives.
          </p>
          <Button asChild size="lg" className="text-lg px-12">
            <Link href="/assessment">
              Begin Assessment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <div className="text-sm text-muted-foreground pt-4">
            <p>
              <strong>Medical Disclaimer:</strong> This tool is for informational purposes only and does not replace
              professional medical advice. Always consult with a healthcare provider for medical decisions.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
