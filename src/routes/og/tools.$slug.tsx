import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from '@vercel/og'
import { formatDistanceToNow } from 'date-fns'
import { CommandPrompt } from '@/components/og/command-prompt'
import { CTAButton } from '@/components/og/cta-button'
import { LogoBox } from '@/components/og/logo-box'
import { OGLayout } from '@/components/og/og-layout'
import { loadOGFonts } from '@/lib/og-fonts'
import { createOGErrorResponse, createOGImageResponse } from '@/lib/og-response'
import { getToolLogoSVG } from '@/lib/og-utils'
import { getToolMetadata } from '@/server/tools'

export const Route = createFileRoute('/og/tools/$slug')({
	server: {
		handlers: {
			GET: async ({ params }) => {
				try {
					const tool = await getToolMetadata({ data: { slug: params.slug } })

					// Return 404 for unknown/missing tools
					if (!tool) {
						return new Response('Tool not found', { status: 404 })
					}

					const fonts = await loadOGFonts()
					const logoSVG = getToolLogoSVG(params.slug)

					const timeAgo = tool.latestReleaseDate
						? formatDistanceToNow(new Date(tool.latestReleaseDate), {
								addSuffix: true,
							})
						: null

					const image = new ImageResponse(
						<OGLayout
							title={`~/tools/${params.slug}`}
							breadcrumbs={[
								'changelogs.directory',
								tool.latestVersion ? `v${tool.latestVersion}` : 'coming soon',
							]}
							indicator="Live Release Feed"
						>
							{/* Command Input */}
							<CommandPrompt
								command={`info ${tool.name.toLowerCase().replace(/\s+/g, '-')}`}
							/>

							{/* Main Content Area */}
							<div
								style={{
									display: 'flex',
									flex: 1,
									alignItems: 'center',
									justifyContent: 'center',
									gap: '64px',
								}}
							>
								{/* Left: Logo */}
								<LogoBox>{logoSVG && logoSVG}</LogoBox>

								{/* Right: Info */}
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
									}}
								>
									<div
										style={{
											display: 'flex',
											fontSize: '64px',
											color: '#FFFFFF',
											fontWeight: 700,
											marginBottom: '16px',
											letterSpacing: '-0.02em',
											textShadow: '0 0 40px rgba(255,255,255,0.2)',
										}}
									>
										{tool.name}
									</div>

									{tool.latestVersion && (
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '16px',
												marginBottom: '24px',
											}}
										>
											<div
												style={{
													display: 'flex',
													fontSize: '32px',
													color: '#FFFFFF',
													background: 'rgba(255, 255, 255, 0.08)',
													padding: '4px 16px',
													borderRadius: '4px',
													border: '1px solid rgba(255, 255, 255, 0.15)',
												}}
											>
												{tool.formattedLatestVersion ||
													`v${tool.latestVersion}`}
											</div>
											{timeAgo && (
												<div
													style={{
														display: 'flex',
														fontSize: '24px',
														color: '#666666',
													}}
												>
													{'//'} {timeAgo}
												</div>
											)}
										</div>
									)}

									<div
										style={{
											display: 'flex',
											gap: '32px',
											color: '#888888',
											fontSize: '20px',
											marginBottom: '32px',
										}}
									>
										<div style={{ display: 'flex', gap: '8px' }}>
											<span style={{ color: '#444444' }}>VENDOR:</span>
											<span style={{ color: '#CCCCCC' }}>
												{tool.vendor || 'Unknown'}
											</span>
										</div>
										<div style={{ display: 'flex', gap: '8px' }}>
											<span style={{ color: '#444444' }}>RELEASES:</span>
											<span style={{ color: '#CCCCCC' }}>
												{tool._count.releases}
											</span>
										</div>
									</div>

									{/* Call to Action */}
									<CTAButton />
								</div>
							</div>
						</OGLayout>,
						{
							width: 1200,
							height: 630,
							fonts,
						},
					)

					return createOGImageResponse(image.body)
				} catch (error) {
					return createOGErrorResponse(error, 'tool detail')
				}
			},
		},
	},
})
