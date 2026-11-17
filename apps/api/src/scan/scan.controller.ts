import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ScanService } from './scan.service';
import { UsageService } from '../usage/usage.service';
import { CreateScanDto, GuestScanDto } from './dto/create-scan.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth.decorator';
import {
  NormalizedDetectionResult,
  ScanDetailDto,
  ScanSummaryDto,
  UserUsageDto,
  GuestRateLimitStatusDto,
} from '@ai-detector/shared-types';

@Controller('api/v1')
export class ScanController {
  constructor(
    private readonly scanService: ScanService,
    private readonly usageService: UsageService,
  ) {}

  /**
   * Anonymous guest scan: 100% ephemeral in-memory processing. Zero text stored.
   */
  @Post('scans/anonymous')
  @HttpCode(HttpStatus.OK)
  async createGuestScan(
    @Req() req: Request,
    @Body() dto: GuestScanDto,
  ): Promise<NormalizedDetectionResult> {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    return this.scanService.executeGuestScan(clientIp, dto.text);
  }

  /**
   * Registered user scan: two-phase lock-free reservation and persistent scan history.
   */
  @Post('scans')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createUserScan(
    @CurrentUser() user: any,
    @Body() dto: CreateScanDto,
  ): Promise<ScanDetailDto> {
    return this.scanService.executeUserScan(user.id, dto);
  }

  /**
   * Retrieves paginated scan history for the authenticated user.
   */
  @Get('scans')
  @UseGuards(AuthGuard)
  async getUserScans(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<{ scans: ScanSummaryDto[]; total: number }> {
    return this.scanService.getUserScans(user.id, page, limit);
  }

  /**
   * Retrieves full scan details with sentence heatmap scores.
   */
  @Get('scans/:id')
  @UseGuards(AuthGuard)
  async getScanById(
    @CurrentUser() user: any,
    @Param('id') scanId: string,
  ): Promise<ScanDetailDto> {
    return this.scanService.getScanById(user.id, scanId);
  }

  /**
   * Permanently deletes a scan and its associated sentence/result records.
   */
  @Delete('scans/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteScan(
    @CurrentUser() user: any,
    @Param('id') scanId: string,
  ): Promise<void> {
    return this.scanService.deleteScan(user.id, scanId);
  }

  /**
   * Retrieves current monthly usage and character allowance for authenticated user.
   */
  @Get('usage/me')
  @UseGuards(AuthGuard)
  async getUserUsage(@CurrentUser() user: any): Promise<UserUsageDto> {
    return this.usageService.getUserUsage(user.id);
  }

  /**
   * Retrieves daily guest rate-limit status for current IP address.
   */
  @Get('usage/guest')
  async getGuestUsage(@Req() req: Request): Promise<GuestRateLimitStatusDto> {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    return this.usageService.getGuestRateLimitStatus(clientIp);
  }
}
