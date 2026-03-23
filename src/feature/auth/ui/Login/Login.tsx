import {setIsLoggedInAC} from '@/app/appSlice';
import {Alert, AlertDescription} from '@/common/components/ui/alert';
import {Badge} from '@/common/components/ui/badge';
import {Button} from '@/common/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/common/components/ui/card';
import {Checkbox} from '@/common/components/ui/checkbox';
import {Input} from '@/common/components/ui/input';
import {Label} from '@/common/components/ui/label';
import {ResultCode} from '@/common/enums'
import {useAppDispatch} from '@/common/hooks/useAppDispatch';
import {setStoredAuthToken} from '@/common/utils/authStorage';
import {useLazyGetCaptchaUrlQuery, useLoginMutation} from '@/feature/auth/api/authApi';
import {type LoginInputs, loginSchema} from '@/feature/auth/lib/schemas';
import {zodResolver} from '@hookform/resolvers/zod'
import {ArrowUpRight, Eye, EyeOff, ListChecks, ShieldCheck, Sparkles, Workflow} from 'lucide-react';
import {useState} from 'react'
import {Controller, type SubmitHandler, useForm} from 'react-hook-form'

export const Login = () => {
    const dispatch = useAppDispatch()

    const [login] = useLoginMutation()
    const [getCaptchaUrl] = useLazyGetCaptchaUrlQuery()

    const [captchaUrl, setCaptchaUrl] = useState<string | null>(null)
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        control,
        setError,
        formState: {errors},
    } = useForm<LoginInputs>({
        resolver: zodResolver(loginSchema),
        defaultValues: {email: '', password: '', rememberMe: false, captcha: ''},
    })

    const onSubmit: SubmitHandler<LoginInputs> = async (data) => {
        const res = await login(data)

        if ('data' in res && res.data?.resultCode === ResultCode.Success) {
            dispatch(setIsLoggedInAC({isLoggedIn: true}))
            setStoredAuthToken(res.data.data.token, Boolean(data.rememberMe))
            setCaptchaUrl(null)
            reset()
        }

        if ('data' in res && res.data?.fieldsErrors?.length) {
            res.data.fieldsErrors.forEach((fieldError) => {
                if (['email', 'password', 'captcha'].includes(fieldError.field)) {
                    setError(fieldError.field as keyof LoginInputs, {
                        type: 'server',
                        message: fieldError.error,
                    })
                }
            })
        }

        if ('data' in res && res.data?.resultCode === ResultCode.Error && res.data.messages?.length) {
            setError('root', {type: 'server', message: res.data.messages[0]})
        }

        if ('data' in res && res.data?.resultCode === ResultCode.CaptchaError) {
            const captchaRes = await getCaptchaUrl()
            if ('data' in captchaRes) {
                setCaptchaUrl(captchaRes.data?.url ?? null)
            }
        }
    }

    const productHighlights = [
        {
            icon: Workflow,
            title: 'Real backend flow',
            description: 'Authentication and task operations run against the SamuraiJS API through RTK Query.',
        },
        {
            icon: ListChecks,
            title: 'Focused interaction design',
            description: 'Inline editing, filtering, pagination, and polished empty states keep the workflow clear.',
        },
        {
            icon: ShieldCheck,
            title: 'Production-minded foundations',
            description: 'Typed forms, validation, optimistic UI patterns, and a deployable Vite setup.',
        },
    ]

    return (
        <div className="relative min-h-full overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.18),transparent_30%)]" />
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:px-8">
                <section className="animate-fade-up rounded-[32px] border border-border/60 bg-card/80 p-6 shadow-[0_35px_120px_-80px_rgba(15,23,42,0.9)] backdrop-blur sm:p-8">
                    <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-primary">
                        Portfolio showcase
                    </Badge>
                    <h1 className="font-display mt-5 max-w-3xl text-4xl leading-none sm:text-5xl lg:text-6xl">
                        Task management with a real product feel.
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                        Sign in to explore a production-style todo dashboard with authentication, remote data sync, typed forms, and a refined UI built for portfolio presentation.
                    </p>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        {productHighlights.map(({ icon: Icon, title, description }, index) => (
                            <article
                                key={title}
                                className="rounded-[24px] border border-border/60 bg-background/70 p-4"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <h2 className="mt-4 text-lg font-semibold">{title}</h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                            </article>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-wrap gap-2">
                        {['React 19', 'TypeScript', 'RTK Query', 'React Hook Form', 'Zod', 'Tailwind CSS 4'].map((item) => (
                            <span key={item} className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-sm text-muted-foreground">
                                {item}
                            </span>
                        ))}
                    </div>
                </section>

                <Card className="animate-fade-up w-full border-border/60 bg-card/90 shadow-[0_35px_110px_-70px_rgba(15,23,42,1)] backdrop-blur">
                    <CardHeader className="space-y-3">
                        <CardTitle className="font-display text-3xl">Sign in</CardTitle>
                        <CardDescription className="max-w-md leading-6">
                            Use the demo account below or register on the SamuraiJS platform to access the dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="rounded-2xl border border-border/60 bg-muted/35 px-4 py-4 text-sm text-muted-foreground space-y-2">
                            <p>
                                Need your own account?{" "}
                                <a
                                    href="https://social-network.samuraijs.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                                >
                                    Register on SamuraiJS
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </a>
                            </p>
                            <p>
                                <span className="font-medium text-foreground">Email:</span> free@samuraijs.com
                            </p>
                            <p>
                                <span className="font-medium text-foreground">Password:</span> free
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@example.com"
                                    aria-invalid={Boolean(errors.email)}
                                    className="h-11 rounded-2xl"
                                    {...register('email')}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={isPasswordVisible ? "text" : "password"}
                                        placeholder="••••••••"
                                        aria-invalid={Boolean(errors.password)}
                                        className="h-11 rounded-2xl pr-10"
                                        {...register('password')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsPasswordVisible((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                                    >
                                        {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                            </div>

                            {captchaUrl && (
                                <div className="space-y-2">
                                    <img src={captchaUrl} alt="captcha" className="h-12 rounded-lg border border-border/60" />
                                    <Label htmlFor="captcha">Captcha</Label>
                                    <Input
                                        id="captcha"
                                        placeholder="Enter captcha"
                                        aria-invalid={Boolean(errors.captcha)}
                                        className="h-11 rounded-2xl"
                                        {...register('captcha')}
                                    />
                                    {errors.captcha && (
                                        <p className="text-sm text-destructive">{errors.captcha.message}</p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <Controller
                                    name="rememberMe"
                                    control={control}
                                    render={({field}) => (
                                        <Checkbox
                                            id="rememberMe"
                                            checked={field.value}
                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                        />
                                    )}
                                />
                                <Label htmlFor="rememberMe" className="text-sm font-normal">
                                    Remember me
                                </Label>
                            </div>

                            {errors.root?.message && (
                                <Alert variant="destructive">
                                    <AlertDescription>{errors.root.message}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="h-11 w-full rounded-2xl">
                                Enter dashboard
                            </Button>
                        </form>

                        <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                            <p className="inline-flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Dark mode, responsive layout, and typed validation are already included in the experience.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
