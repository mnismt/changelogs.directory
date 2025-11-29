import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from '@vercel/og'
import { CommandPrompt } from '@/components/og/command-prompt'
import { OGLayout } from '@/components/og/og-layout'
import { loadOGFonts } from '@/lib/og-fonts'
import { createOGErrorResponse, createOGImageResponse } from '@/lib/og-response'
import { getToolLogoSVG } from '@/lib/og-utils'
import { getAllTools } from '@/server/tools'

export const Route = createFileRoute('/og/tools')({
	server: {
		handlers: {
			GET: async () => {
				try {
					// Fetch data
					const { tools, stats } = await getAllTools()
					const fonts = await loadOGFonts()

					// Get logos for first 3 tools
					const toolLogos = tools.slice(0, 3).map((tool) => ({
						slug: tool.slug,
						name: tool.name,
						logo: getToolLogoSVG(tool.slug, 80),
					}))

					const image = new ImageResponse(
						<OGLayout
							title="~/tools"
							breadcrumbs={['changelogs.directory', 'tools']}
							indicator="Live Release Feed"
						>
							{/* Command Line Interface */}
							<CommandPrompt command="ls tools/" />

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
										fontSize: '52px',
										color: '#FFFFFF',
										fontWeight: 700,
										marginBottom: '48px',
										letterSpacing: '-0.02em',
										textShadow: '0 0 40px rgba(255,255,255,0.2)',
									}}
								>
									changelogs.directory
								</div>

								{/* Subtitle */}
								<div
									style={{
										display: 'flex',
										fontSize: '32px',
										color: '#666666',
										marginBottom: '48px',
										fontFamily: 'Fira Code',
									}}
								>
									~/tools
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
										gap: '48px',
										marginBottom: '60px',
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
														width: '100px',
														height: '100px',
														alignItems: 'center',
														justifyContent: 'center',
														background: 'rgba(255, 255, 255, 0.03)',
														border: '1px solid rgba(255, 255, 255, 0.08)',
														borderRadius: '16px',
														padding: '16px',
													}}
												>
													{tool.logo}
												</div>
												<div
													style={{
														display: 'flex',
														fontFamily: 'Fira Code',
														fontSize: '14px',
														color: '#888888',
													}}
												>
													{tool.name}
												</div>
											</div>
										) : null,
									)}
								</div>

								{/* Tagline */}
								<div
									style={{
										display: 'flex',
										fontFamily: 'Inter',
										fontSize: '20px',
										color: '#888888',
										textAlign: 'center',
									}}
								>
									Tracking CLI developer tools, one changelog at a time.
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
					return createOGErrorResponse(error, 'tools')
				}
			},
		},
	},
})
