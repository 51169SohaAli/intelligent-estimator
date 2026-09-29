import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterManagerDto {
  @IsNotEmpty({ message: 'Please add a name' })
  @IsString()
  name!: string;

  @IsEmail({}, { message: 'Please add a valid email' })
  @IsNotEmpty({ message: 'Please add an email' })
  email!: string;

  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @IsOptional() // 👈 Allows invited users to sign up without entering a workspace name
  @IsString()
  companyName?: string;
}