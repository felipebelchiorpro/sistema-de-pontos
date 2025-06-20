"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { registerSaleAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Percent, CheckCircle } from "lucide-react";

const SaleSchema = z.object({
  coupon: z.string().min(1, { message: "Cupom é obrigatório." }),
  totalSaleValue: z.coerce.number().positive({ message: "Valor da venda deve ser positivo." }),
});

type SaleFormData = z.infer<typeof SaleSchema>;

const initialState = {
  message: "",
  errors: {},
  success: false,
  pointsGenerated: 0,
  discountedValue: 0,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Registrando Venda..." : "Confirmar Venda"}
      {!pending && <CheckCircle className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export function SalesForm() {
  const [state, formAction] = useFormState(registerSaleAction, initialState);
  const { toast } = useToast();

  const [calculatedDiscountedValue, setCalculatedDiscountedValue] = useState<number | null>(null);
  const [calculatedPointsGenerated, setCalculatedPointsGenerated] = useState<number | null>(null);

  const form = useForm<SaleFormData>({
    resolver: zodResolver(SaleSchema),
    defaultValues: {
      coupon: "",
      totalSaleValue: 0,
    },
  });

  const totalSaleValue = form.watch("totalSaleValue");

  useEffect(() => {
    if (totalSaleValue > 0) {
      const discount = totalSaleValue * 0.075;
      setCalculatedDiscountedValue(parseFloat((totalSaleValue - discount).toFixed(2)));
      setCalculatedPointsGenerated(parseFloat((totalSaleValue * 0.075).toFixed(2)));
    } else {
      setCalculatedDiscountedValue(null);
      setCalculatedPointsGenerated(null);
    }
  }, [totalSaleValue]);

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Sucesso!",
        description: `${state.message} Pontos Gerados: ${state.pointsGenerated?.toFixed(2)}. Valor com Desconto: R$ ${state.discountedValue?.toFixed(2)}.`,
      });
      form.reset();
      setCalculatedDiscountedValue(null);
      setCalculatedPointsGenerated(null);
    } else if (state.message && !state.success && state.errors) {
      const errorFields = state.errors as any;
       if (errorFields?.coupon) form.setError("coupon", { type: "manual", message: errorFields.coupon[0] });
       if (errorFields?.totalSaleValue) form.setError("totalSaleValue", { type: "manual", message: errorFields.totalSaleValue[0] });
       
       if (!errorFields?.coupon && !errorFields?.totalSaleValue && state.message) {
         toast({
            title: "Erro ao registrar venda",
            description: state.message,
            variant: "destructive",
         });
       }
    } else if (state.message && !state.success) {
        toast({
            title: "Erro",
            description: state.message,
            variant: "destructive",
        });
    }
  }, [state, toast, form]);

  const handleFormSubmit = (data: SaleFormData) => {
    const formData = new FormData();
    formData.append("coupon", data.coupon.toUpperCase());
    formData.append("totalSaleValue", data.totalSaleValue.toString());
    formAction(formData);
  };
  
  const handleCouponChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("coupon", event.target.value.toUpperCase(), { shouldValidate: true });
  };


  return (
    <Card className="w-full max-w-md bg-card">
      <CardHeader>
        <CardTitle>Registrar Venda com Cupom</CardTitle>
        <CardDescription>Insira o cupom do parceiro e o valor total da compra.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="coupon">Cupom do Parceiro</Label>
            <Input
              id="coupon"
              {...form.register("coupon")}
              placeholder="CUPOM123"
              onChange={handleCouponChange}
              className="bg-input"
            />
            {form.formState.errors.coupon && (
              <p className="text-sm text-destructive">{form.formState.errors.coupon.message}</p>
            )}
             {state?.errors?.coupon && (
               <p className="text-sm text-destructive">{state.errors.coupon[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalSaleValue">Valor Total da Compra (R$)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="totalSaleValue"
                type="number"
                step="0.01"
                {...form.register("totalSaleValue")}
                placeholder="100.00"
                className="pl-9 bg-input"
              />
            </div>
            {form.formState.errors.totalSaleValue && (
              <p className="text-sm text-destructive">{form.formState.errors.totalSaleValue.message}</p>
            )}
            {state?.errors?.totalSaleValue && (
               <p className="text-sm text-destructive">{state.errors.totalSaleValue[0]}</p>
            )}
          </div>

          {calculatedDiscountedValue !== null && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center p-3 rounded-md bg-secondary/50">
                <span className="text-sm text-muted-foreground">Valor com Desconto (7.5%):</span>
                <span className="font-semibold text-foreground">R$ {calculatedDiscountedValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-md bg-secondary/50">
                <span className="text-sm text-muted-foreground">Pontos Gerados (7.5%):</span>
                <span className="font-semibold text-primary">{calculatedPointsGenerated?.toFixed(2)} pts</span>
              </div>
            </div>
          )}
            <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
