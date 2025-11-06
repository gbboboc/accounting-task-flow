import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SupabaseModule } from './supabase/supabase.module';
import { RpcModule } from './rpc/rpc.module';

@Module({
  imports: [SupabaseModule, RpcModule],
  controllers: [AppController],
})
export class AppModule {}

