
import { DiscountCalculator } from "@/components/calculator/DiscountCalculator";

export default function CalculatorPage() {
  return (
    <div className="flex flex-col items-center justify-start pt-8 md:pt-12">
        <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 text-center">Calculadora de Desconto</h1>
            <p className="text-muted-foreground mb-8 text-center">Simule rapidamente o valor de uma venda com o desconto do parceiro.</p>
            <DiscountCalculator />
        </div>
    </div>
  );
}
