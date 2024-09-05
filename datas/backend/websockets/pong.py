class Player:
	def __init__(self, *args, **kwargs):
		self.id = args[0]
		self.name = args[1]
		self.score = 0
		self.is_ready = False
		self.is_winner = False
		self.ws = None


class Game:
	def __init__(self, *args, **kwargs):
		self.match_id = args[0]
		self.player1 = None
		self.player2 = None
		self.score = [0, 0]

