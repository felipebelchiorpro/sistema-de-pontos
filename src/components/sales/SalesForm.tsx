
"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { registerSaleAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, CheckCircle, ExternalLink, Calendar } from "lucide-react";
import type { Partner } from "@/types";
import { DatePicker } from "@/components/ui/date-picker";

const SaleSchema = z.object({
  coupon: z.string({ required_error: "Por favor, selecione um cupom." }).min(1, { message: "Cupom é obrigatório." }),
  totalSaleValue: z.coerce.number().positive({ message: "Valor da venda deve ser positivo." }),
  externalSaleId: z.string().optional(),
  saleDate: z.date().optional(),
});

type SaleFormData = z.infer<typeof SaleSchema>;

const initialState = {
  title: "",
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

export function SalesForm({ partners }: { partners: Partner[] }) {
  const [state, formAction] = useActionState(registerSaleAction, initialState);
  const { toast } = useToast();

  const [calculatedDiscountedValue, setCalculatedDiscountedValue] = useState<number | null>(null);
  const [calculatedPointsGenerated, setCalculatedPointsGenerated] = useState<number | null>(null);

  const form = useForm<SaleFormData>({
    resolver: zodResolver(SaleSchema),
    defaultValues: {
      coupon: "",
      totalSaleValue: 0,
      externalSaleId: "",
      saleDate: undefined,
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
        title: state.title || "Sucesso!",
        description: `${state.message} Pontos Gerados: ${state.pointsGenerated?.toFixed(2)}. Valor com Desconto: R$ ${state.discountedValue?.toFixed(2)}.`,
      });
      form.reset();
      setCalculatedDiscountedValue(null);
      setCalculatedPointsGenerated(null);
    } else if (!state.success && state.message) {
        const errorFields = state.errors as any;
        let shownFieldErrorToast = false;

        if (errorFields) {
            if (errorFields.coupon?.[0]) {
                form.setError("coupon", { type: "manual", message: errorFields.coupon[0] });
                shownFieldErrorToast = true;
            }
            if (errorFields.totalSaleValue?.[0]) {
                form.setError("totalSaleValue", { type: "manual", message: errorFields.totalSaleValue[0] });
                shownFieldErrorToast = true;
            }
            if (errorFields.externalSaleId?.[0]) {
                form.setError("externalSaleId", { type: "manual", message: errorFields.externalSaleId[0] });
                shownFieldErrorToast = true;
            }
            if (errorFields._form?.[0]) {
                toast({
                    title: state.title || "Erro",
                    description: errorFields._form[0],
                    variant: "destructive",
                });
                shownFieldErrorToast = true;
            }
        }
        
        if (!shownFieldErrorToast && state.message) {
            toast({
                title: state.title || "Erro ao registrar venda",
                description: state.message,
                variant: "destructive",
            });
        }
    }
  }, [state, toast, form]);

  const handleFormSubmit = (data: SaleFormData) => {
    const formData = new FormData();
    formData.append("coupon", data.coupon);
    formData.append("totalSaleValue", data.totalSaleValue.toString());
    if (data.externalSaleId && data.externalSaleId.trim() !== "") {
      formData.append("externalSaleId", data.externalSaleId);
    }
    if (data.saleDate) {
      formData.append("saleDate", data.saleDate.toISOString());
    }
    formAction(formData);
  };
  
  return (
    <Card className="w-full max-w-md bg-card">
      <CardHeader>
        <CardTitle>Registrar Venda com Cupom</CardTitle>
        <CardDescription>Selecione o cupom do parceiro e insira o valor da compra.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="coupon"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cupom do Parceiro</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="bg-input">
                                    <SelectValue placeholder="Selecione um cupom" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {partners.length > 0 ? (
                                    partners.map((partner) => (
                                    <SelectItem key={partner.id} value={partner.coupon}>
                                        {partner.name} ({partner.coupon})
                                    </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-muted-foreground text-center">Nenhum parceiro cadastrado.</div>
                                )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="totalSaleValue"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor Total da Compra (R$)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="100.00"
                                        className="pl-9 bg-input"
                                        {...field}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="externalSaleId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Código da Venda (Sistema Externo)</FormLabel>
                             <FormControl>
                                <div className="relative">
                                    <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Ex: PEDIDO123XYZ (Opcional)"
                                        className="pl-9 bg-input"
                                        {...field}
                                    />
                                </div>
                             </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="saleDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Data da Venda (Opcional)</FormLabel>
                            <DatePicker 
                                date={field.value} 
                                setDate={field.onChange} 
                                placeholder="Hoje"
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {calculatedDiscountedValue !== null && totalSaleValue > 0 &&(
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
        </Form>
      </CardContent>
    </Card>
  );
}
