'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Palette,
  Type,
  Square,
  Circle,
  StickyNote,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

export default function DemoBoardPage() {
  const [showFeatures, setShowFeatures] = useState(false);

  const features = [
    {
      icon: <Type className="h-8 w-8 text-blue-500" />,
      title: "Texto y Notas",
      description: "Agrega texto, notas adhesivas y contenido rico en cualquier lugar del canvas"
    },
    {
      icon: <Square className="h-8 w-8 text-green-500" />,
      title: "Figuras y Dibujos",
      description: "Crea formas geométricas, diagramas y dibujos libres"
    },
    {
      icon: <Palette className="h-8 w-8 text-purple-500" />,
      title: "Colores y Estilos",
      description: "Personaliza colores, tamaños y estilos para expresar tu creatividad"
    },
    {
      icon: <ImageIcon className="h-8 w-8 text-orange-500" />,
      title: "Imágenes y Multimedia",
      description: "Inserta imágenes, videos y contenido multimedia"
    },
    {
      icon: <StickyNote className="h-8 w-8 text-yellow-500" />,
      title: "Notas adhesivas",
      description: "Organiza tus ideas con notas de colores que puedes mover libremente"
    },
    {
      icon: <Sparkles className="h-8 w-8 text-pink-500" />,
      title: "Canvas Infinito",
      description: "Trabaja en un espacio ilimitado sin restricciones de tamaño"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/'}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <h1 className="font-semibold text-lg">Mi Cerebro - Demo</h1>
                <p className="text-sm text-muted-foreground">Vista de demostración</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Circle className="h-3 w-3 fill-green-500 text-green-500" />
              Modo Demo
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!showFeatures ? (
          <div className="text-center space-y-8">
            {/* Hero Section */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                ¡Bienvenido al Demo Interactivo!
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mi Cerebro
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Tu lienzo de ideas infinitas. Organiza pensamientos, crea diagramas y libera tu creatividad en un canvas sin límites.
              </p>
            </div>

            {/* Demo Canvas Preview */}
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Vista Previa del Canvas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 border-2 border-dashed border-gray-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sample Elements */}
                    <div className="bg-yellow-100 p-4 rounded-lg shadow-sm border border-yellow-200">
                      <StickyNote className="h-6 w-6 text-yellow-600 mb-2" />
                      <p className="text-sm font-medium text-yellow-800">Idea Principal</p>
                      <p className="text-xs text-yellow-700 mt-1">Notas adhesivas de colores</p>
                    </div>

                    <div className="bg-blue-100 p-4 rounded-lg shadow-sm border border-blue-200">
                      <Type className="h-6 w-6 text-blue-600 mb-2" />
                      <p className="text-sm font-medium text-blue-800">Texto Libre</p>
                      <p className="text-xs text-blue-700 mt-1">Edición de texto enriquecido</p>
                    </div>

                    <div className="bg-green-100 p-4 rounded-lg shadow-sm border border-green-200">
                      <Square className="h-6 w-6 text-green-600 mb-2" />
                      <p className="text-sm font-medium text-green-800">Formas</p>
                      <p className="text-xs text-green-700 mt-1">Figuras y diagramas</p>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Este es solo un ejemplo. En el canvas real puedes colocar elementos en cualquier posición.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
                onClick={() => setShowFeatures(true)}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Explorar Características
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => window.location.href = '/'}
                className="px-8"
              >
                Crear Cuenta Gratis
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => setShowFeatures(false)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>

            {/* Features Grid */}
            <div>
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-4">Características Principales</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Descubre todas las herramientas que Mi Cerebro pone a tu disposición para organizar y expresar tus ideas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        {feature.icon}
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Call to Action */}
            <div className="text-center space-y-4">
              <h4 className="text-2xl font-bold">¿Listo para crear tu propio canvas?</h4>
              <p className="text-muted-foreground max-w-md mx-auto">
                Regístrate gratis y comienza a organizar tus ideas de manera visual e intuitiva.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={() => window.location.href = '/'}
              >
                Comenzar Ahora - ¡Es Gratis!
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}