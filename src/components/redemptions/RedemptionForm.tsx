
"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";


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

export function RedemptionForm() {
  const [state, formAction] = useActionState(redeemPointsAction, initialActionState);
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
      setCouponCheckError(null); // Clear previous coupon check error
      form.clearErrors("coupon"); // Clear RHF error for coupon
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
      // Don't clear couponCheckError here if length < 3, let RHF handle min length validation
      if (watchedCoupon.length === 0) setCouponCheckError(null);
    }
    return () => clearTimeout(debounceTimer);
  }, [watchedCoupon, form]);


  useEffect(() => {
    if (state.success) {
      toast({
        title: state.title || "Sucesso!",
        description: state.message,
      });
      form.reset();
      setCurrentPartnerPoints(null);
      setCouponCheckError(null);
    } else if (!state.success && state.message) {
      const errorFields = state.errors as any;
      let shownFieldErrorToast = false;

      if (errorFields) {
        if (errorFields.coupon?.[0]) {
          form.setError("coupon", { type: "manual", message: errorFields.coupon[0] });
          // Do not set couponCheckError here, as it's for a different validation
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
    if (couponCheckError) { // Prevent submission if there's an active coupon check error
        form.setError("coupon", {type: "manual", message: couponCheckError});
        return;
    }
    const formData = new FormData();
    formData.append("coupon", data.coupon.toUpperCase());
    formData.append("pointsToRedeem", data.pointsToRedeem.toString());
    formAction(formData);
  };

  const handleCouponInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("coupon", event.target.value.toUpperCase(), { shouldValidate: true });
    // Clear specific coupon check error when user types, RHF will re-validate length
    if (couponCheckError) setCouponCheckError(null); 
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
            {/* Display server-side error for coupon only if not already handled by RHF or couponCheckError */}
            {state?.errors?.coupon && Array.isArray(state.errors.coupon) && !form.formState.errors.coupon && !couponCheckError && (
               <p className="text-sm text-destructive">{state.errors.coupon[0]}</p>
            )}
            {couponCheckError && !form.formState.errors.coupon && ( // Show couponCheckError if no RHF error for coupon
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
                    disabled={currentPartnerPoints === null && !couponCheckError && !form.formState.errors.coupon} 
                />
            </div>
            {form.formState.errors.pointsToRedeem && (
              <p className="text-sm text-destructive">{form.formState.errors.pointsToRedeem.message}</p>
            )}
            {state?.errors?.pointsToRedeem && Array.isArray(state.errors.pointsToRedeem) && !form.formState.errors.pointsToRedeem &&(
               <p className="text-sm text-destructive">{state.errors.pointsToRedeem[0]}</p>
            )}
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
