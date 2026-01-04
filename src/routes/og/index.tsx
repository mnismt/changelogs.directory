import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from '@vercel/og'
import { CommandPrompt } from '@/components/og/command-prompt'
import { OGLayout } from '@/components/og/og-layout'
import { loadOGFonts } from '@/lib/og-fonts'
import { createOGErrorResponse, createOGImageResponse } from '@/lib/og-response'
import { getToolLogoSVG } from '@/lib/og-utils'
import { getAllTools } from '@/server/tools'

export const Route = createFileRoute('/og/')({
	server: {
		handlers: {
			GET: async () => {
				try {
					// Fetch data
					const { tools, stats } = await getAllTools()
					const fonts = await loadOGFonts()

					// Get logos for first 5 tools
					const toolLogos = tools.slice(0, 5).map((tool) => ({
						slug: tool.slug,
						name: tool.name,
						logo: getToolLogoSVG(tool.slug, 80),
					}))

					const image = new ImageResponse(
						<OGLayout
							title="~"
							breadcrumbs={['changelogs.directory', 'home']}
							indicator="Live Release Feed"
						>
							{/* Command Line Interface */}
							<CommandPrompt command="changelogs.directory" />

							{/* Content Center */}
							<div
								style={{
									flex: 1,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									marginTop: '-20px',
								}}
							>
								{/* Main Title */}
								<div
									style={{
										display: 'flex',
										fontSize: '64px',
										color: '#FFFFFF',
										fontWeight: 700,
										marginBottom: '32px',
										letterSpacing: '-0.02em',
										textShadow: '0 0 40px rgba(255,255,255,0.2)',
									}}
								>
									changelogs.directory_
								</div>

								{/* Tagline */}
								<div
									style={{
										display: 'flex',
										fontSize: '24px',
										color: '#888888',
										marginBottom: '48px',
										fontFamily: 'Inter',
										textAlign: 'center',
										maxWidth: '800px',
										lineHeight: 1.4,
									}}
								>
									The developer's hub for tracking CLI and editor releases.
								</div>

								{/* Stats */}
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '24px',
										marginBottom: '60px',
										fontFamily: 'Fira Code',
										fontSize: '18px',
										color: '#666666',
									}}
								>
									<div style={{ display: 'flex', gap: '8px' }}>
										<span>TOTAL_TOOLS:</span>
										<span style={{ color: '#FFFFFF' }}>{stats.totalTools}</span>
									</div>
									<span style={{ color: '#444444' }}>|</span>
									<div style={{ display: 'flex', gap: '8px' }}>
										<span>TOTAL_RELEASES:</span>
										<span style={{ color: '#FFFFFF' }}>
											{stats.totalReleases}
										</span>
									</div>
								</div>

								{/* Tool Logos Grid */}
								<div
									style={{
										display: 'flex',
										gap: '40px',
									}}
								>
									{toolLogos.map((tool) =>
										tool.logo ? (
											<div
												key={tool.slug}
												style={{
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'center',
													gap: '16px',
												}}
											>
												{/* Logo Container */}
												<div
													style={{
														display: 'flex',
														width: '90px',
														height: '90px',
														alignItems: 'center',
														justifyContent: 'center',
														background: 'rgba(255, 255, 255, 0.03)',
														border: '1px solid rgba(255, 255, 255, 0.08)',
														borderRadius: '16px',
														padding: '14px',
													}}
												>
													{tool.logo}
												</div>
											</div>
										) : null,
									)}
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
					return createOGErrorResponse(error, 'home')
				}
			},
		},
	},
})
