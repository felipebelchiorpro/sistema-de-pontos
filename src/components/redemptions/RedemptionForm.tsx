
"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { redeemPointsAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Gift, CheckCircle } from "lucide-react";
import type { Partner } from "@/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SheetSelect } from "@/components/ui/sheet-select";

const RedemptionSchema = z.object({
  coupon: z.string({ required_error: "Por favor, selecione um parceiro." }).min(1, { message: "Cupom é obrigatório." }),
  pointsToRedeem: z.coerce.number().positive({ message: "Pontos a resgatar devem ser positivos." }),
});

type RedemptionFormData = z.infer<typeof RedemptionSchema>;

const initialActionState = {
  title: "",
  message: "",
  errors: {},
  success: false,
};


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Resgatando Pontos..." : "Confirmar Resgate"}
      {!pending && <CheckCircle className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export function RedemptionForm({ partners }: { partners: Partner[] }) {
  const [state, formAction] = useActionState(redeemPointsAction, initialActionState);
  const { toast } = useToast();
  const [currentPartnerPoints, setCurrentPartnerPoints] = useState<number | null>(null);

  const form = useForm<RedemptionFormData>({
    resolver: zodResolver(RedemptionSchema),
    defaultValues: {
      coupon: "",
      pointsToRedeem: 0,
    },
  });

  const watchedCoupon = form.watch("coupon");

  useEffect(() => {
    if (watchedCoupon) {
      const selectedPartner = partners.find(p => p.coupon === watchedCoupon);
      setCurrentPartnerPoints(selectedPartner ? selectedPartner.points : null);
    } else {
      setCurrentPartnerPoints(null);
    }
  }, [watchedCoupon, partners]);


  useEffect(() => {
    if (state.success) {
      toast({
        title: state.title || "Sucesso!",
        description: state.message,
      });
      form.reset();
      setCurrentPartnerPoints(null);
    } else if (!state.success && state.message) {
      const errorFields = state.errors as any;
      let shownFieldErrorToast = false;

      if (errorFields) {
        if (errorFields.coupon?.[0]) {
          form.setError("coupon", { type: "manual", message: errorFields.coupon[0] });
          shownFieldErrorToast = true;
        }
        if (errorFields.pointsToRedeem?.[0]) {
          form.setError("pointsToRedeem", { type: "manual", message: errorFields.pointsToRedeem[0] });
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
            title: state.title || "Erro ao resgatar pontos",
            description: state.message,
            variant: "destructive",
        });
      }
    }
  }, [state, toast, form]);

  const handleFormSubmit = (data: RedemptionFormData) => {
    const formData = new FormData();
    formData.append("coupon", data.coupon.toUpperCase());
    formData.append("pointsToRedeem", data.pointsToRedeem.toString());
    formAction(formData);
  };

  return (
    <Card className="w-full max-w-md bg-card">
      <CardHeader>
        <CardTitle>Resgatar Pontos do Parceiro</CardTitle>
        <CardDescription>Selecione o parceiro e insira a quantidade de pontos a serem resgatados.</CardDescription>
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
                             <FormControl>
                                <SheetSelect
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    placeholder="Selecione um parceiro"
                                    title="Selecionar Parceiro"
                                    options={partners.map((partner) => ({
                                        value: partner.coupon,
                                        label: `${partner.name} (${partner.coupon})`,
                                    }))}
                                    className="bg-input"
                                />
                            </FormControl>
                            <FormMessage />
                             {currentPartnerPoints !== null && (
                                <p className="text-sm text-muted-foreground pt-1">
                                    Pontos disponíveis: <span className="font-semibold text-primary">{currentPartnerPoints.toFixed(2)}</span>
                                </p>
                            )}
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="pointsToRedeem"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Pontos a Resgatar</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="50.00"
                                        className="pl-9 bg-input"
                                        disabled={currentPartnerPoints === null}
                                        {...field}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <SubmitButton />
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
