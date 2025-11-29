import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from '@vercel/og'
import { OGBackground } from '@/components/og/og-background'
import { TerminalChrome } from '@/components/og/terminal-chrome'
import { loadOGFonts } from '@/lib/og-fonts'
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
						<div
							style={{
								height: '100%',
								width: '100%',
								display: 'flex',
								flexDirection: 'column',
								backgroundColor: '#0A0A0A',
								position: 'relative',
							}}
						>
							{/* Background texture */}
							<OGBackground />

							{/* Radial Glow Effect */}
							<div
								style={{
									display: 'flex',
									position: 'absolute',
									top: '50%',
									left: '50%',
									transform: 'translate(-50%, -50%)',
									width: '800px',
									height: '800px',
									background:
										'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 70%)',
									filter: 'blur(40px)',
									opacity: 0.6,
								}}
							/>

							{/* Terminal chrome */}
							<TerminalChrome title="~/tools" />

							{/* Main content area */}
							<div
								style={{
									flex: 1,
									display: 'flex',
									flexDirection: 'column',
									padding: '40px 60px',
									position: 'relative',
								}}
							>
								{/* Command Line Interface */}
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '12px',
										fontSize: '24px',
										color: '#AAAAAA',
										marginBottom: '48px',
									}}
								>
									<span style={{ color: '#CCCCCC' }}>&gt;</span>
									<span style={{ color: '#999999' }}>~</span>
									<span>ls tools/</span>
									<div
										style={{
											display: 'flex',
											width: '12px',
											height: '24px',
											backgroundColor: '#AAAAAA',
											marginLeft: '4px',
										}}
									/>
								</div>

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
											<span style={{ color: '#FFFFFF' }}>
												{stats.totalTools}
											</span>
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
							</div>

							{/* Status Bar */}
							<div
								style={{
									height: '32px',
									backgroundColor: '#1A1A1A',
									borderTop: '1px solid #333333',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '0 16px',
									fontFamily: 'Fira Code',
									fontSize: '13px',
									color: '#666666',
									fontWeight: 500,
								}}
							>
								<div style={{ display: 'flex', gap: '20px' }}>
									<span style={{ color: '#888888' }}>changelogs.directory</span>
									<span style={{ color: '#444444' }}>/</span>
									<span style={{ color: '#888888' }}>tools</span>
								</div>
								<div
									style={{
										display: 'flex',
										gap: '8px',
										alignItems: 'center',
										color: '#555555',
									}}
								>
									<span>●</span>
									<span style={{ fontSize: '12px', fontFamily: 'Inter' }}>
										Live Release Feed
									</span>
								</div>
							</div>
						</div>,
						{
							width: 1200,
							height: 630,
							fonts,
						},
					)

					return new Response(image.body, {
						headers: {
							'Content-Type': 'image/png',
							'Cache-Control':
								'public, max-age=3600, s-maxage=86400, stale-while-revalidate=31536000',
						},
					})
				} catch (error) {
					console.error('Error generating tools OG image:', error)
					return new Response('Failed to generate OG image', { status: 500 })
				}
			},
		},
	},
})
