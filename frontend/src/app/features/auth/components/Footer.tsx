import { Separator } from "./ui/separator";
import SocialLogin from "./SocialLogin";

function Footer() {
  return (
    <>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <SocialLogin />
    </>
  );
}
export default Footer;
