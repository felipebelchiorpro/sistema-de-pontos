"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { redeemPointsAction, fetchPartnerPointsAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Gift, CheckCircle } from "lucide-react";

const RedemptionSchema = z.object({
  coupon: z.string().min(1, { message: "Cupom é obrigatório." }),
  pointsToRedeem: z.coerce.number().positive({ message: "Pontos a resgatar devem ser positivos." }),
});

type RedemptionFormData = z.infer<typeof RedemptionSchema>;

const initialActionState = {
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

export function RedemptionForm() {
  const [state, formAction] = useFormState(redeemPointsAction, initialActionState);
  const { toast } = useToast();
  const [currentPartnerPoints, setCurrentPartnerPoints] = useState<number | null>(null);
  const [couponCheckError, setCouponCheckError] = useState<string | null>(null);


  const form = useForm<RedemptionFormData>({
    resolver: zodResolver(RedemptionSchema),
    defaultValues: {
      coupon: "",
      pointsToRedeem: 0,
    },
  });

  const watchedCoupon = form.watch("coupon");

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    if (watchedCoupon && watchedCoupon.length >= 3) {
      setCouponCheckError(null);
      debounceTimer = setTimeout(async () => {
        const result = await fetchPartnerPointsAction(watchedCoupon.toUpperCase());
        if (result.points !== null) {
          setCurrentPartnerPoints(result.points);
          setCouponCheckError(null);
        } else {
          setCurrentPartnerPoints(null);
          setCouponCheckError(result.error || "Cupom não encontrado ou erro ao buscar pontos.");
        }
      }, 500);
    } else {
      setCurrentPartnerPoints(null);
      setCouponCheckError(null);
    }
    return () => clearTimeout(debounceTimer);
  }, [watchedCoupon]);


  useEffect(() => {
    if (state.success) {
      toast({
        title: "Sucesso!",
        description: state.message,
      });
      form.reset();
      setCurrentPartnerPoints(null);
      setCouponCheckError(null);
    } else if (state.message && !state.success && state.errors) {
      const errorFields = state.errors as any;
       if (errorFields?.coupon?.[0]) form.setError("coupon", { type: "manual", message: errorFields.coupon[0] });
       if (errorFields?.pointsToRedeem?.[0]) form.setError("pointsToRedeem", { type: "manual", message: errorFields.pointsToRedeem[0] });

       // Exibe erro geral se não for erro de campo específico
       if (!errorFields?.coupon && !errorFields?.pointsToRedeem && state.message && !errorFields?._form?.[0]) {
          toast({
            title: "Erro ao resgatar pontos",
            description: state.message,
            variant: "destructive",
          });
       } else if (errorFields?._form?.[0]) { // Erro geral retornado pelo _form
            toast({
                title: "Erro",
                description: errorFields._form[0],
                variant: "destructive",
            });
       }
    } else if (state.message && !state.success && Object.keys(state.errors || {}).length === 0) {
        toast({
            title: "Erro",
            description: state.message,
            variant: "destructive",
        });
    }
  }, [state, toast, form]);

  const handleFormSubmit = (data: RedemptionFormData) => {
    const formData = new FormData();
    formData.append("coupon", data.coupon.toUpperCase());
    formData.append("pointsToRedeem", data.pointsToRedeem.toString());
    formAction(formData);
  };

  const handleCouponInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("coupon", event.target.value.toUpperCase(), { shouldValidate: true });
  };


  return (
    <Card className="w-full max-w-md bg-card">
      <CardHeader>
        <CardTitle>Resgatar Pontos do Parceiro</CardTitle>
        <CardDescription>Insira o cupom e a quantidade de pontos a serem resgatados.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="coupon-redeem">Cupom do Parceiro</Label>
            <Input
              id="coupon-redeem"
              {...form.register("coupon")}
              placeholder="CUPOM123"
              onChange={handleCouponInputChange}
              className="bg-input"
            />
            {form.formState.errors.coupon && (
              <p className="text-sm text-destructive">{form.formState.errors.coupon.message}</p>
            )}
            {state?.errors?.coupon && Array.isArray(state.errors.coupon) && (
               <p className="text-sm text-destructive">{state.errors.coupon[0]}</p>
            )}
            {couponCheckError && !form.formState.errors.coupon && (
                <p className="text-sm text-destructive">{couponCheckError}</p>
            )}
            {currentPartnerPoints !== null && (
              <p className="text-sm text-muted-foreground">
                Pontos disponíveis: <span className="font-semibold text-primary">{currentPartnerPoints.toFixed(2)}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pointsToRedeem">Pontos a Resgatar</Label>
            <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="pointsToRedeem"
                    type="number"
                    step="0.01"
                    {...form.register("pointsToRedeem")}
                    placeholder="50.00"
                    className="pl-9 bg-input"
                    disabled={currentPartnerPoints === null && !couponCheckError} // Disable if no points or coupon is invalid
                />
            </div>
            {form.formState.errors.pointsToRedeem && (
              <p className="text-sm text-destructive">{form.formState.errors.pointsToRedeem.message}</p>
            )}
            {state?.errors?.pointsToRedeem && Array.isArray(state.errors.pointsToRedeem) &&(
               <p className="text-sm text-destructive">{state.errors.pointsToRedeem[0]}</p>
            )}
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
