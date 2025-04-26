import { CardDescription, CardHeader, CardTitle } from "./ui/card";

interface HeaderProps {
  title: string;
  description: string;
}

function Header({ title, description }: HeaderProps) {
  return (
    <CardHeader className="space-y-1 pb-2">
      <CardTitle className="text-2xl font-bold">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
}
export default Header;
