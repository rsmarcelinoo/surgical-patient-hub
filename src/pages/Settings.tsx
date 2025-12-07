/**
 * Settings Page
 * 
 * Allows users to configure application preferences including:
 * - Language (English/Portuguese)
 * - Theme (Light/Dark mode)
 */

import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSettings } from "@/contexts/SettingsContext";
import { Globe, Moon, Sun } from "lucide-react";

export default function Settings() {
  const { language, setLanguage, theme, setTheme, t } = useSettings();

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {language === "en" ? "Manage your application preferences" : "Gerir as preferências da aplicação"}
          </p>
        </div>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t("settings.language")}</CardTitle>
            </div>
            <CardDescription>
              {language === "en" ? "Select your preferred language" : "Selecione o idioma preferido"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={language} onValueChange={(value) => setLanguage(value as "en" | "pt")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en" id="lang-en" />
                <Label htmlFor="lang-en" className="cursor-pointer">
                  {t("settings.english")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pt" id="lang-pt" />
                <Label htmlFor="lang-pt" className="cursor-pointer">
                  {t("settings.portuguese")}
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {theme === "light" ? (
                <Sun className="h-5 w-5 text-primary" />
              ) : (
                <Moon className="h-5 w-5 text-primary" />
              )}
              <CardTitle className="text-lg">{t("settings.theme")}</CardTitle>
            </div>
            <CardDescription>
              {language === "en" ? "Choose between light and dark mode" : "Escolha entre modo claro e escuro"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light" className="cursor-pointer flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  {t("settings.lightMode")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark" className="cursor-pointer flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  {t("settings.darkMode")}
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
