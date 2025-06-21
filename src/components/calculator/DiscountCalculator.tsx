
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";

const DISCOUNT_RATE = 0.075;

export function DiscountCalculator() {
  const [saleValue, setSaleValue] = useState<string>("");

  const { discount, finalValue } = useMemo(() => {
    const numericSaleValue = parseFloat(saleValue);
    if (isNaN(numericSaleValue) || numericSaleValue <= 0) {
      return { discount: 0, finalValue: 0, points: 0 };
    }
    const calculatedDiscount = numericSaleValue * DISCOUNT_RATE;
    const calculatedFinalValue = numericSaleValue - calculatedDiscount;
    return {
      discount: calculatedDiscount,
      finalValue: calculatedFinalValue,
    };
  }, [saleValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Simplified handler for better cross-device compatibility
    setSaleValue(e.target.value);
  };

  return (
    <Card className="w-full max-w-md bg-card">
      <CardHeader>
        <CardTitle>Simulador de Desconto</CardTitle>
        <CardDescription>
          Calcule o valor final da venda com o desconto de 7,5% do parceiro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="saleValue">Valor Total da Venda (R$)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="saleValue"
              type="text"
              inputMode="decimal"
              value={saleValue}
              onChange={handleInputChange}
              placeholder="100.00"
              className="pl-9 bg-input"
            />
          </div>
        </div>

        {parseFloat(saleValue) > 0 && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center p-3 rounded-md bg-secondary/50">
              <span className="text-sm text-muted-foreground">Desconto (7,5%):</span>
              <span className="font-semibold text-destructive">- R$ {discount.toFixed(2)}</span>
            </div>
             <div className="flex justify-between items-center p-3 rounded-md bg-secondary/50">
              <span className="text-sm text-muted-foreground">Pontos Gerados (7,5%):</span>
              <span className="font-semibold text-chart-4">{discount.toFixed(2)} pts</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-md bg-primary/20 mt-2">
              <span className="text-base font-medium text-primary-foreground">Valor Final com Desconto:</span>
              <span className="text-lg font-bold text-primary">R$ {finalValue.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
