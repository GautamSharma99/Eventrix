    def _draw_pre_game_screen(self):
        """Display countdown and trading info during pre-game period."""
        screen = self.game.screen
        screen.fill((20, 20, 40))  # Dark blue background
        
        # Calculate remaining time
        remaining_ticks = self.PRE_GAME_TRADING_TICKS - self.pre_game_timer
        remaining_seconds = remaining_ticks // 60
        minutes = remaining_seconds // 60
        seconds = remaining_seconds % 60
        
        # Title
        title_font = pg.font.Font(None, 72)
        title = title_font.render("PRE-GAME ENTERING", True, (100, 200, 255))
        title_rect = title.get_rect(center=(WIDTH // 2, HEIGHT // 4))
        screen.blit(title, title_rect)
        
        # Countdown timer
        timer_font = pg.font.Font(None, 120)
        timer_color = (255, 200, 50) if remaining_seconds > 10 else (255, 100, 100)
        timer_text = timer_font.render(f"{minutes}:{seconds:02d}", True, timer_color)
        timer_rect = timer_text.get_rect(center=(WIDTH // 2, HEIGHT // 2))
        screen.blit(timer_text, timer_rect)

        # Agent list — shown above the info text block
        agent_font = pg.font.Font(None, 28)
        agents_title = agent_font.render("Agents in this game:", True, (150, 150, 150))
        agents_title_rect = agents_title.get_rect(center=(WIDTH // 2, HEIGHT * 3 // 4 - 20))
        screen.blit(agents_title, agents_title_rect)

        agent_text = ", ".join(self.all_colours[:10])
        agents_display = agent_font.render(agent_text, True, (200, 200, 200))
        agents_display_rect = agents_display.get_rect(center=(WIDTH // 2, HEIGHT * 3 // 4 + 10))
        screen.blit(agents_display, agents_display_rect)

        # Info text block — below the agent list with proper spacing
        info_font = pg.font.Font(None, 36)
        info_lines = [
            ("Enter the room asap!", WHITE),
            ("Trading will lock when the game starts.", WHITE),
            ("Winners' token holders split 90% of prize pool.", (100, 220, 100)),
        ]

        y_offset = HEIGHT * 3 // 4 + 58
        for line, color in info_lines:
            info = info_font.render(line, True, color)
            info_rect = info.get_rect(center=(WIDTH // 2, y_offset))
            screen.blit(info, info_rect)
            y_offset += 52

        pg.display.flip()
