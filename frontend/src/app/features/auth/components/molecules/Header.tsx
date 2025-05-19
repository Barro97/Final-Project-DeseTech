import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/molecules/card";

interface HeaderProps {
  title: string;
  description: string;
}

function Header({ title, description }: HeaderProps) {
  return (
    <CardHeader className="space-y-1 pb-2">
      <CardTitle className="text-2xl font-bold" as="div">
        {title}
      </CardTitle>
      <CardDescription as="div">{description}</CardDescription>
    </CardHeader>
  );
}
export default Header;
